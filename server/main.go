package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
)

// Player represents a connected client in a room
type Player struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Color      string `json:"color"` // "white" | "black" | "spectator"
	Token      string `json:"-"`     // Secret token for move authentication (not exposed publicly)
	TimeLeftMs int64  `json:"timeLeftMs"`
}

// Room represents an active multiplayer match
type Room struct {
	ID           string    `json:"id"`
	WhitePlayer  *Player   `json:"whitePlayer,omitempty"`
	BlackPlayer  *Player   `json:"blackPlayer,omitempty"`
	Turn         string    `json:"turn"` // "white" | "black"
	LastMoveTime time.Time `json:"lastMoveTime"`
	Fen          string    `json:"fen"`
	History      []string  `json:"history"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	mu           sync.Mutex
}

// Hub manages active rooms
type Hub struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

var hub = &Hub{
	rooms: make(map[string]*Room),
}

type MovePayload struct {
	RoomID string `json:"roomId"`
	Token  string `json:"token"`
	From   string `json:"from"`
	To     string `json:"to"`
	San    string `json:"san"`
	Fen    string `json:"fen"`
	Player string `json:"player"` // "white" | "black"
}

type CreateRoomResponse struct {
	Room        *Room  `json:"room"`
	PlayerToken string `json:"playerToken"`
	Color       string `json:"color"`
}

func generateSecureToken(byteLength int) string {
	b := make([]byte, byteLength)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("t-%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

func getCorsOrigin() string {
	origin := os.Getenv("ALLOWED_ORIGIN")
	if origin != "" {
		return origin
	}
	return "*"
}

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", getCorsOrigin())
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

// Cleanup inactive rooms periodically to prevent unbounded memory growth
func startRoomCleanup(hub *Hub, interval time.Duration, maxAge time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			now := time.Now()
			hub.mu.Lock()
			pruned := 0
			for id, room := range hub.rooms {
				room.mu.Lock()
				isOld := now.Sub(room.LastMoveTime) > maxAge
				room.mu.Unlock()
				if isOld {
					delete(hub.rooms, id)
					pruned++
				}
			}
			hub.mu.Unlock()
			if pruned > 0 {
				log.Printf("[Hub] Pruned %d expired rooms. Active rooms: %d", pruned, len(hub.rooms))
			}
		}
	}()
}

// Handle Room Creation
func handleCreateRoom(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 1MB body limit
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	roomID := generateSecureToken(8)
	whiteToken := generateSecureToken(16)
	blackToken := generateSecureToken(16)

	now := time.Now()
	room := &Room{
		ID:           roomID,
		Turn:         "white",
		Fen:          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		History:      []string{},
		IsActive:     true,
		CreatedAt:    now,
		LastMoveTime: now,
		WhitePlayer: &Player{
			ID:         "p-white-" + roomID[:4],
			Name:       "Player 1 (White)",
			Color:      "white",
			Token:      whiteToken,
			TimeLeftMs: 300000, // 5 minutes standard
		},
		BlackPlayer: &Player{
			ID:         "p-black-" + roomID[:4],
			Name:       "Player 2 (Black)",
			Color:      "black",
			Token:      blackToken,
			TimeLeftMs: 300000,
		},
	}

	hub.mu.Lock()
	hub.rooms[roomID] = room
	hub.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(CreateRoomResponse{
		Room:        room,
		PlayerToken: whiteToken,
		Color:       "white",
	})
}

// Handle Authoritative Move Validation and Clock Delta
func handleMakeMove(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var payload MovePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	hub.mu.RLock()
	room, exists := hub.rooms[payload.RoomID]
	hub.mu.RUnlock()

	if !exists {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if !room.IsActive {
		http.Error(w, "Game is already completed", http.StatusBadRequest)
		return
	}

	// Verify player identity per color
	if room.Turn == "white" {
		if payload.Token != room.WhitePlayer.Token {
			http.Error(w, "Unauthorized: It is White's turn", http.StatusForbidden)
			return
		}
	} else {
		if payload.Token != room.BlackPlayer.Token {
			http.Error(w, "Unauthorized: It is Black's turn", http.StatusForbidden)
			return
		}
	}

	// Compute elapsed monotonic time and update clock
	now := time.Now()
	elapsed := now.Sub(room.LastMoveTime).Milliseconds()

	if room.Turn == "white" {
		room.WhitePlayer.TimeLeftMs -= elapsed
		if room.WhitePlayer.TimeLeftMs <= 0 {
			room.WhitePlayer.TimeLeftMs = 0
			room.IsActive = false
			http.Error(w, "White has flagged (time expired)", http.StatusBadRequest)
			return
		}
		room.Turn = "black"
	} else {
		room.BlackPlayer.TimeLeftMs -= elapsed
		if room.BlackPlayer.TimeLeftMs <= 0 {
			room.BlackPlayer.TimeLeftMs = 0
			room.IsActive = false
			http.Error(w, "Black has flagged (time expired)", http.StatusBadRequest)
			return
		}
		room.Turn = "white"
	}

	room.LastMoveTime = now
	room.Fen = payload.Fen
	if payload.San != "" {
		room.History = append(room.History, payload.San)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(room)
}

// Health Check
func handleHealth(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"online","service":"sovereign-chess-go-game-server","version":"2.0.0"}`))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/room/create", handleCreateRoom)
	mux.HandleFunc("/api/room/move", handleMakeMove)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if !strings.HasPrefix(port, ":") {
		port = ":" + port
	}

	// Periodic cleanup of inactive rooms every 5 minutes (max inactivity 2 hours)
	startRoomCleanup(hub, 5*time.Minute, 2*time.Hour)

	server := &http.Server{
		Addr:              port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Graceful shutdown channel
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("♟️ Sovereign Chess Go Realtime Game Server listening on port %s", port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-stopChan
	log.Println("♟️ Shutting down server gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	log.Println("♟️ Server shutdown complete.")
}
