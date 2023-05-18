package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func PublisherWorkerSetup() *PublisherWorker {
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Received request with path: %s\n", r.URL)
		reqPath := r.URL.Path
		if strings.EqualFold(reqPath, "/api/v0/name/publish") {
			respData := map[string]string{
				"Name": "foobar",
			}
			respBytes, _ := json.Marshal(respData)
			w.Write(respBytes)
		}
	}))

	worker := NewPublisherWorker(testServer.URL)
	worker.CheckInterval = time.Second // Check queue every second for testing
	go worker.Start()

	return worker
}

func TestPublisherWorker_AddTaskAndWaitForProcessing(t *testing.T) {
	worker := PublisherWorkerSetup()
	assert.Equal(t, len(worker.taskPool), 0)
	taskId := worker.AddTask("testKey", "testPath")
	assert.Equal(t, len(worker.taskPool), 1)
	assert.Equal(t, worker.TaskIpnsPath(taskId), "")
	time.Sleep(2 * time.Second)

	// Note: this response is mocked by test server, and only struct is correct
	assert.Equal(t, worker.TaskIpnsPath(taskId), "/ipns/foobar")
}
