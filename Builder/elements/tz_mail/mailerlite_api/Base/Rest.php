<?php

namespace MailerLite\Base;

use InvalidArgumentException;

class Rest extends RestBase {

	protected
		$name = '',
		$id = null;

	function __construct($apiKey)
	{
		parent::__construct();
		$this->apiKey = $apiKey;
		$this->path = $this->url . $this->name . '/';
	}

	function setId($id)
	{
		$this->id = $id;
		if ($this->id)
		{
			$this->path = $this->url . $this->name . '/' . $id . '/';
		}
		else
		{
			$this->path = $this->url . $this->name . '/';
		}
		return $this;
	}

	function getAll()
	{
		return $this->execute('GET');
	}

	function get()
	{
		if ( ! $this->id)
		{
			throw new InvalidArgumentException('ID is not set.');
		}
		return $this->execute('GET');
	}

	function add($data = null)
	{
		return $this->execute('POST', $data);
	}

	function put($data = null)
	{
		return $this->execute('PUT', $data);
	}

	function remove()
	{
		return $this->execute('DELETE');
	}

}
