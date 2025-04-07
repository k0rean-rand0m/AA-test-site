package ld

import (
	"github.com/LinkdropHQ/linkdrop-go-sdk"
	"github.com/LinkdropHQ/linkdrop-go-sdk/helpers"
	"github.com/LinkdropHQ/linkdrop-go-sdk/types"
	"github.com/ethereum/go-ethereum/common"
	"log"
	"math/big"
	"math/rand"
	"os"
)

var sdk *linkdrop.SDK
var claimLink *linkdrop.ClaimLink

func Init() {
	var err error
	sdk, err = linkdrop.Init(
		"https://p2p.linkdrop.io",
		os.Getenv("LINKDROP_API_KEY"),
		linkdrop.WithApiUrl(os.Getenv("LINKDROP_API_URL")),
	)
	if err != nil {
		log.Fatalln(err)
	}
}

func getRandomBytes(length int64) []byte {
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		log.Fatalf("Failed to generate random bytes: %v", err)
	}
	return b
}

func ClaimLink(sender common.Address) (string, error) {
	var err error
	claimLink, err = sdk.ClaimLink(
		linkdrop.ClaimLinkCreationParams{
			Token: types.Token{
				Type:    types.TokenTypeERC20,
				ChainId: types.ChainIdBase,
				Address: common.HexToAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"),
			},

			Sender:     sender,
			Amount:     big.NewInt(10000),
			Expiration: 1773234550,
		},
		getRandomBytes,
	)
	if err != nil {
		log.Fatalln(err)
	}
	return claimLink.ClaimUrl()
}

func DepositData() string {
	params, err := claimLink.GetDepositParams()
	if err != nil {
		log.Fatalln(err)
	}
	return helpers.ToHex(params.Data)
}

func DepositRegister(txHash string) error {
	return claimLink.DepositRegister(
		types.Transaction{
			Hash: common.HexToHash(txHash),
			Type: types.TransactionTypeUserOp,
		},
	)
}
