package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type TaskStatus uint8

const (
	TaskPending TaskStatus = iota
	TaskProcessing
	TaskFinished
)

type PublishTask struct {
	Id       string // Publish ID generated by caller
	PubKey   string // IPFS key used for publishing the IPFS path
	IpfsPath string

	CreatedAt  int64 // Task created millisecond
	FinishedAt int64 // Task published millisecond
}

type PublisherWorker struct {
	IpfsRpcAddr string
	MsgCh       *chan *PublishTask

	CheckInterval     time.Duration
	TaskExpiredSecond int

	taskPoolLock sync.Mutex
	taskPool     map[string]PublishTask
	taskStatus   map[string]TaskStatus

	ipfsClient *fiber.Client
}

// NewPublisherWorker Create PublisherWorker with default config
// TODO: Change to singleton mode
func NewPublisherWorker(ipfsRpcApiAddr string) *PublisherWorker {
	return &PublisherWorker{
		IpfsRpcAddr:       ipfsRpcApiAddr,
		CheckInterval:     2 * time.Second,
		TaskExpiredSecond: 60 * 60, // Task will be expired after 60 minutes
		taskStatus:        map[string]TaskStatus{},
		taskPool:          map[string]PublishTask{},
		ipfsClient:        fiber.AcquireClient(),
	}
}

// Start function starts the publishing and clean task
func (p *PublisherWorker) Start() {
	wg := &sync.WaitGroup{}
	go p.processPublishTask(wg)
	go p.processCleanTask(wg)
	wg.Wait()
}

// AddTask creates a task object with timestamp
func (p *PublisherWorker) AddTask(pubKey, ipfsPath string) string {
	task := PublishTask{
		Id:         uuid.NewString(),
		PubKey:     pubKey,
		IpfsPath:   ipfsPath,
		CreatedAt:  time.Now().UnixMilli(),
		FinishedAt: 0,
	}

	p.taskPoolLock.Lock()
	defer p.taskPoolLock.Unlock()
	p.taskPool[ipfsPath] = task
	p.taskStatus[task.Id] = TaskPending
	return task.Id
}

// Convert task into API call and send to IPFS server
func (p *PublisherWorker) processPublishTask(wg *sync.WaitGroup) {
	wg.Add(1)
	ticker := time.NewTicker(p.CheckInterval)

	for {
		select {
		case <-ticker.C:
			log.Println("publish tasks")
			pendingTasks := map[string]PublishTask{}
			p.taskPoolLock.Lock()
			// Move all tasks to new created one and clear original task map
			for k, v := range p.taskPool {
				pendingTasks[k] = v
			}
			p.taskPool = map[string]PublishTask{}
			p.taskPoolLock.Unlock()

			for _, task := range pendingTasks {
				go p.doPublish(&task)
			}
		}
	}
}

// Clean task has been finished after TaskExpiredSecond seconds
func (p *PublisherWorker) processCleanTask(wg *sync.WaitGroup) {
	wg.Add(1)
	ticker := time.NewTicker(p.CheckInterval)

	for {
		select {
		case <-ticker.C:
			log.Println("Clean expired tasks")
		}
	}

}

func (p *PublisherWorker) doPublish(task *PublishTask) {
	publishUrl := fmt.Sprintf("%s/api/v0/name/publish?arg=%s&key=%s", p.IpfsRpcAddr, task.IpfsPath, task.PubKey)
	a := p.ipfsClient.Post(publishUrl)
	if err := a.Parse(); err != nil {
		panic(err)
	}

	code, body, errs := a.Bytes()
	log.Printf("Code: %d, Body: %q, err: %+v\n", code, body, errs)
	if code == http.StatusOK {
		p.taskPoolLock.Lock()
		defer p.taskPoolLock.Unlock()

		p.taskStatus[task.Id] = TaskFinished
		task.FinishedAt = time.Now().UnixMilli()
		p.taskPool[task.Id] = *task
	}
}

// IsTaskPublished checks whether the task has been published.
// Note, querying expired task will also return false here
func (p *PublisherWorker) IsTaskPublished(taskId string) bool {
	if taskStatus, found := p.taskStatus[taskId]; found {
		return taskStatus == TaskFinished
	}

	// The task id may be cleared from status map, return true directly
	return true
}
