package main

import (
	"crypto/rand"
	"github.com/LinkdropHQ/linkdrop-go-sdk"
	"github.com/LinkdropHQ/linkdrop-go-sdk/helpers"
	"github.com/LinkdropHQ/linkdrop-go-sdk/types"
	"github.com/ethereum/go-ethereum/common"
	"github.com/joho/godotenv"
	"log"
	"math/big"
	"os"
)

func getRandomBytes(length int64) []byte {
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		log.Fatalf("Failed to generate random bytes: %v", err)
	}
	return b
}

func main() {
	err := godotenv.Load()
	sdk, err := linkdrop.Init("https://p2p.linkdrop.io", os.Getenv("LINKDROP_API_KEY"))
	if err != nil {
		log.Fatalln(err)
	}

	// ERC20
	clERC20, err := sdk.ClaimLink(
		linkdrop.ClaimLinkCreationParams{
			Token: types.Token{
				Type:    types.TokenTypeERC20,
				ChainId: types.ChainIdBase,
				Address: common.HexToAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"),
			},
			Sender:     common.HexToAddress("0x8ECa89F2cfbaB3E12E3c8fe5a138139bDDb0Bd8d"),
			Amount:     big.NewInt(10000),
			Expiration: 1773234550,
		},
		getRandomBytes,
	)
	if err != nil {
		log.Fatalln(err)
	}

	url, err := clERC20.ClaimUrl()
	if err != nil {
		log.Fatalln(err)
	}

	params, err := clERC20.GetDepositParams()
	if err != nil {
		log.Fatalln(err)
	}
	data := helpers.ToHex(params.Data)

	log.Println("Claim Link:", url)
	log.Println("TX data: 0x" + data)
}
