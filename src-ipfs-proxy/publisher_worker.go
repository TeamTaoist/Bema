package main

import "time"

type PublishTask struct {
	Id         string
	PubKey     string
	IpfsPath   string
	CreatedAt  int64
	FinishedAt int64
}

type PublisherWorker struct {
	IpfsRpcAddr string
	MsgCh       *chan *PublishTask

	CheckInterval     time.Duration
	TaskExpiredSecond int

	PublishedTasks         map[string]uint8 // Saves published and not expired tasks
	WaitForPublishingTasks map[string]uint8 // Saves tasks will be processed later

}

func NewPublisherWorker(ipfsRpcApiAddr string) *PublisherWorker {
	return &PublisherWorker{
		IpfsRpcAddr:       ipfsRpcApiAddr,
		CheckInterval:     2 * time.Second,
		TaskExpiredSecond: 60 * 60, // Task will be expired after 60 minutes
	}
}

// Start function starts the publishing and clean task
func (p *PublisherWorker) Start() {}

// Convert task into API call and send to IPFS server
func (p *PublisherWorker) processPublishTask() {}

// Clean task has been finished after TaskExpiredSecond seconds
func (p *PublisherWorker) processCleanTask() {}

// IsTaskPublished checks whether the task has been published.
// Note, querying expired task will also return false here
func (p *PublisherWorker) IsTaskPublished(taskId string) {}
