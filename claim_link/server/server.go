package server

import (
	"claim-link/ld"
	"encoding/json"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"net/http"
)

func RunServer() {
	http.HandleFunc("/claim_link", claimLink) // GET
	http.HandleFunc("/tx_data", txData)       // GET
	http.HandleFunc("/deposit", deposit)      // POST

	fmt.Println("Starting server on :9090")
	err := http.ListenAndServe(":9090", nil)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}

func claimLink(w http.ResponseWriter, r *http.Request) {
	sender := common.HexToAddress(r.URL.Query().Get("sender"))
	url, err := ld.ClaimLink(sender)
	if err != nil {
		http.Error(w, "Failed to create claim link", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	resp, _ := json.Marshal(map[string]string{
		"url": url,
	})
	w.Write(resp)
}

func txData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	resp, _ := json.Marshal(map[string]string{
		"data": ld.DepositData(),
	})
	w.Write(resp)
}

func deposit(w http.ResponseWriter, r *http.Request) {
	var requestBody map[string]any
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Failed to parse request body", http.StatusBadRequest)
		return
	}
	err = ld.DepositRegister(requestBody["txHash"].(string))
	if err != nil {
		http.Error(w, "Failed to register deposit", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
	resp, _ := json.Marshal(map[string]bool{
		"success": true,
	})
	w.Write(resp)
}
