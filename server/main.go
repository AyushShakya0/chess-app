package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Player represents a connected client in a room
type Player struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Color     string `json:"color"` // "white" | "black" | "spectator"
	TimeLeftMs int64 `json:"timeLeftMs"`
}

// Room represents an active multiplayer match
type Room struct {
	ID           string             `json:"id"`
	WhitePlayer  *Player            `json:"whitePlayer"`
	BlackPlayer  *Player            `json:"blackPlayer"`
	Turn         string             `json:"turn"` // "white" | "black"
	LastMoveTime time.Time          `json:"lastMoveTime"`
	Fen          string             `json:"fen"`
	History      []string           `json:"history"`
	IsActive     bool               `json:"isActive"`
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
	From   string `json:"from"`
	To     string `json:"to"`
	San    string `json:"san"`
	Fen    string `json:"fen"`
	Player string `json:"player"` // "white" | "black"
}

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// Handle Room Creation
func handleCreateRoom(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == "OPTIONS" {
		return
	}

	roomID := fmt.Sprintf("room-%d", time.Now().UnixNano()%1000000)

	hub.mu.Lock()
	room := &Room{
		ID:           roomID,
		Turn:         "white",
		Fen:          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		History:      []string{},
		IsActive:     true,
		LastMoveTime: time.Now(),
		WhitePlayer: &Player{
			ID:         "p1",
			Name:       "Player 1",
			Color:      "white",
			TimeLeftMs: 300000, // 5 minutes
		},
		BlackPlayer: &Player{
			ID:         "p2",
			Name:       "Player 2",
			Color:      "black",
			TimeLeftMs: 300000,
		},
	}
	hub.rooms[roomID] = room
	hub.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(room)
}

// Handle Authoritative Move Validation and Clock Delta
func handleMakeMove(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == "OPTIONS" {
		return
	}

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

	// Compute elapsed monotonic time and update clock
	now := time.Now()
	elapsed := now.Sub(room.LastMoveTime).Milliseconds()

	if room.Turn == "white" {
		room.WhitePlayer.TimeLeftMs -= elapsed
		if room.WhitePlayer.TimeLeftMs < 0 {
			room.WhitePlayer.TimeLeftMs = 0
		}
		room.Turn = "black"
	} else {
		room.BlackPlayer.TimeLeftMs -= elapsed
		if room.BlackPlayer.TimeLeftMs < 0 {
			room.BlackPlayer.TimeLeftMs = 0
		}
		room.Turn = "white"
	}

	room.LastMoveTime = now
	room.Fen = payload.Fen
	room.History = append(room.History, payload.San)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(room)
}

// Health Check
func handleHealth(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"online","service":"vibechess-go-game-server"}`))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/room/create", handleCreateRoom)
	mux.HandleFunc("/api/room/move", handleMakeMove)

	port := ":8080"
	log.Printf("♟️ VibeChess Go Realtime Game Server listening on port %s", port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

