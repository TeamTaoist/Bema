package main

import (
	"log"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func PublisherWorkerSetup() *PublisherWorker {
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Received request with path: %s\n", r.URL)
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
	assert.False(t, worker.IsTaskPublished(taskId))
	time.Sleep(2 * time.Second)
	assert.True(t, worker.IsTaskPublished(taskId))
}

//func TestPublisherWorker_TaskProcessed(t *testing.T) {
//	worker := PublisherWorkerSetup()
//	taskId := worker.AddTask("testKey", "testPath")
//	log.Printf("Task id: %s\n", taskId)
//}
