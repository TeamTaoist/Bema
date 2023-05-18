package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

const BackendServiceRespBody = "backend service"
const PreDefinedFileContent = "this is a temporary file"

type ValidatorType int8

const (
	CheckBodyEqual ValidatorType = iota
	CheckFileResp
	CheckJsonResp
)

// ValidatorParams saves params used for validator function
type ValidatorParams struct {
	ExpectedString  string
	IsRegexp        bool
	MustHaveKeys    map[string]bool
	MustNotHaveKeys map[string]bool
	CheckType       ValidatorType
}

func (p *ValidatorParams) StrEqual(strToBeChecked string) bool {
	if p.IsRegexp {
		return regexp.MustCompile(p.ExpectedString).MatchString(strToBeChecked)
	} else {
		return strings.Compare(p.ExpectedString, strToBeChecked) == 0
	}
}

// Generate random port from 1025 ~ 65535
func randomListenAddr() string {
	return fmt.Sprintf(":%d", rand.Intn(65535-1025)+1025)
}

// createRandomDirAndFile create a random directory and
func createRandomDirAndFile() (string, string, error) {
	dir, err := os.MkdirTemp("", "ipfs-proxy-test")
	if err != nil {
		return "", "", err
	}

	// Create a temporary file in the temporary directory
	file, err := os.CreateTemp(dir, "proxy-test-file-*.txt")
	if err != nil {
		os.RemoveAll(dir)
		return "", "", err
	}

	// Write some content to the temporary file
	if _, err := file.Write([]byte(PreDefinedFileContent)); err != nil {
		os.RemoveAll(dir)
		return "", "", err
	}

	// Clean up the temporary file and directory if successful
	if err := file.Close(); err != nil {
		os.RemoveAll(dir)
		return "", "", err
	}

	return dir, file.Name(), nil
}

func setup(t *testing.T) (*fiber.App, *httptest.Server, string, string) {
	listenAddr := randomListenAddr()

	// backendService simulates a service under proxies, which should only be accessed
	// when request API path has `/api` prefix
	backendService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(BackendServiceRespBody))
	}))

	tmpDir, filePath, err := createRandomDirAndFile()
	if err != nil {
		panic(err)
	}

	appConfig := &AppConfig{
		ListenAddr:   listenAddr,
		AllowOrigins: "*",
		IpfsService:  backendService.URL,
		SiteBase:     tmpDir,
	}

	app := NewApplication(appConfig)

	return app, backendService, tmpDir, filePath
}

func mustReadBody(resp *http.Response) []byte {
	buf, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}

	return buf
}

func validatorDispatcher(t *testing.T, resp *http.Response, params *ValidatorParams) {
	switch params.CheckType {
	case CheckFileResp:
		checkFileResp(t, resp, params)
	case CheckBodyEqual:
		checkBodyEqual(t, resp, params)
	case CheckJsonResp:
		checkJsonResp(t, resp, params)
	default:
		panic(fmt.Errorf("unknown check type: %d", params.CheckType))
	}
}

// TODO: How to verify the response is file content
func checkFileResp(t *testing.T, resp *http.Response, params *ValidatorParams) {
	assert.Equal(t, resp.ContentLength, int64(len(PreDefinedFileContent)))
	checkBodyEqual(t, resp, params)
}

func checkBodyEqual(t *testing.T, resp *http.Response, params *ValidatorParams) {
	buf := mustReadBody(resp)
	assert.True(t, params.StrEqual(string(buf)))
}

func checkJsonResp(t *testing.T, resp *http.Response, params *ValidatorParams) {
	log.Printf("resp headers: %+v\n", resp.Header)
	assert.NotNil(t, resp.Header.Get("Content-Type"))
	assert.Equal(t, resp.Header.Get("Content-Type"), "application/json")

	buf := mustReadBody(resp)

	structBuf := map[string]any{}
	err := json.Unmarshal(buf, &structBuf)
	if err != nil {
		panic(err)
	}
	for keyName, _ := range params.MustHaveKeys {
		assert.Contains(t, structBuf, keyName)
	}
}

func TestProxyService(t *testing.T) {
	app, backendService, tmpDir, tmpFilePath := setup(t)
	defer os.RemoveAll(tmpDir)
	defer backendService.Close()

	fileName := filepath.Base(tmpFilePath)

	var tests = []struct {
		name       string
		path       string
		httpMethod string
		params     *ValidatorParams
	}{
		{
			"ShouldFwdReqWithApiPrefixToBackend",
			"/api/foobar",
			"GET",
			&ValidatorParams{ExpectedString: BackendServiceRespBody, IsRegexp: false, CheckType: CheckBodyEqual},
		}, {
			"ShouldProcessReqWithoutApiPrefixSelf",
			fmt.Sprintf("/%s", fileName),
			"GET",
			&ValidatorParams{ExpectedString: PreDefinedFileContent, IsRegexp: false, CheckType: CheckFileResp},
		}, {
			"ShouldReturnPublishTaskIdWhenInvokingIpfsPublishAPI",
			"/api/v0/name/publish?key=pubkey&arg=ipfs_path",
			"POST",
			&ValidatorParams{MustHaveKeys: map[string]bool{"id": true}, CheckType: CheckJsonResp},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.httpMethod, tt.path, nil)
			resp, _ := app.Test(req)

			assert.Equal(t, resp.StatusCode, fiber.StatusOK)
			assert.Contains(t, resp.Header, "Access-Control-Allow-Origin")
			assert.Equal(t, resp.Header.Get("Access-Control-Allow-Origin"), "*")

			validatorDispatcher(t, resp, tt.params)
		})
	}
}
