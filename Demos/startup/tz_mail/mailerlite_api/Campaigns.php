<?php

namespace MailerLite;
	
class Campaigns extends Base\Rest {
	
	public function __construct($apiKey)
	{
		$this->name = 'campaigns';
		parent::__construct($apiKey);
	}

	public function getRecipients($data = null)
	{
		$this->path .= 'recipients/';
		return $this->execute('GET', $data);
	}

	public function getOpens($data = null)
	{
		$this->path .= 'opens/';
		return $this->execute('GET', $data);
	}

	public function getClicks($data = null)
	{
		$this->path .= 'clicks/';
		return $this->execute('GET', $data);
	}

	public function getUnsubscribes($data = null)
	{
		$this->path .= 'unsubscribes/';
		return $this->execute('GET', $data);
	}

	public function getBounces($data = null)
	{
		$this->path .= 'bounces/';
		return $this->execute('GET', $data);
	}

	public function getJunk($data = null)
	{
		$this->path .= 'junk/';
		return $this->execute('GET', $data);
	}

}
