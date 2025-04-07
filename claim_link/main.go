package main

import (
	"claim-link/ld"
	"claim-link/server"
	"github.com/joho/godotenv"
	"log"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalln(err)
	}
	ld.Init()
	server.RunServer()
}
