<?php

namespace MailerLite\Base;

use Exception;
use InvalidArgumentException;

class RestBase {

	protected
		$url,
		$verb,
		$requestBody,
		$requestLength,
		$username,
		$password,
		$acceptType,
		$responseBody,
		$responseInfo,
		$apiKey = '',
		$path = '';
	
	public function __construct ($url = 'http://app.mailerlite.com/api/v1/', $verb = 'GET')
	{
		$this->url				= $url;
		$this->verb				= $verb;
		$this->requestLength	= 0;
		$this->username			= null;
		$this->password			= null;
		$this->acceptType		= 'application/json';
		$this->responseBody		= null;
		$this->responseInfo		= null;
	}
	
	public function flush()
	{
		$this->requestBody		= null;
		$this->requestLength	= 0;
		$this->verb				= 'GET';
		$this->responseBody		= null;
		$this->responseInfo		= null;
	}
	
	public function execute($method = null, $data = null)
	{
		$ch = curl_init();
		$this->setAuth($ch);

		if ( $method )
			$this->verb = $method;

		$this->requestBody = $data;

		$this->buildPostBody();
		
		try
		{
			switch (strtoupper($this->verb))
			{
				case 'GET':
					$this->executeGet($ch);
					break;
				case 'POST':
					$this->executePost($ch);
					break;
				case 'PUT':
					$this->executePut($ch);
					break;
				case 'DELETE':
					$this->executeDelete($ch);
					break;
				default:
					throw new InvalidArgumentException('Current verb (' . $this->verb . ') is an invalid REST verb.');
			}
		}
		catch (InvalidArgumentException $e)
		{
			curl_close($ch);
			throw $e;
		}
		catch (Exception $e)
		{
			curl_close($ch);
			throw $e;
		}

		return $this->responseBody;		
	}
	
	public function buildPostBody()
	{
		$data = $this->requestBody;

		$data['apiKey'] = $this->apiKey;
		
		if (!is_array($data))
		{
			throw new InvalidArgumentException('Invalid data input for postBody.  Array expected');
		}
		
		$data = http_build_query($data, '', '&');
		$this->requestBody = $data;
	}
	
	protected function executeGet($ch)
	{
		$this->path .= ( strpos( $this->path, '?' ) === false ? '?' : '&' ) . $this->requestBody; 

		$this->doExecute($ch);	
	}
	
	protected function executePost($ch)
	{		
		curl_setopt($ch, CURLOPT_POSTFIELDS, $this->requestBody);
		curl_setopt($ch, CURLOPT_POST, 1);
		
		$this->doExecute($ch);	
	}
	
	protected function executePut($ch)
	{		
		$this->requestLength = strlen($this->requestBody);
		
		$fh = fopen('php://memory', 'rw');
		fwrite($fh, $this->requestBody);
		rewind($fh);
		
		curl_setopt($ch, CURLOPT_INFILE, $fh);
		curl_setopt($ch, CURLOPT_INFILESIZE, $this->requestLength);
		curl_setopt($ch, CURLOPT_PUT, true);
		
		$this->doExecute($ch);
		
		fclose($fh);
	}
	
	protected function executeDelete($ch)
	{
		$this->path .= ( strpos( $this->path, '?' ) === false ? '?' : '&' ) . $this->requestBody; 

		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');

		$this->doExecute($ch);
	}
	
	protected function doExecute(&$curlHandle)
	{
		$this->setCurlOpts($curlHandle);
		$this->responseBody = curl_exec($curlHandle);

		if ($this->responseBody === false) {
			$this->responseBody = 'CURL errno: '.curl_errno($curlHandle).', CURL error: '.curl_error($curlHandle);
		}
		
		$this->responseInfo	= curl_getinfo($curlHandle);
		
		curl_close($curlHandle);
	}
	
	protected function setCurlOpts(&$curlHandle)
	{
		curl_setopt($curlHandle, CURLOPT_TIMEOUT, 10);
		curl_setopt($curlHandle, CURLOPT_URL, $this->path);
		curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($curlHandle, CURLOPT_HTTPHEADER, array ('Accept: ' . $this->acceptType));

		//curl_setopt($curlHandle, CURLOPT_SSL_VERIFYHOST, false );
        //curl_setopt($curlHandle, CURLOPT_SSL_VERIFYPEER, false );
        if (!ini_get('open_basedir') && !ini_get('safe_mode'))
        {
            curl_setopt($curlHandle, CURLOPT_FOLLOWLOCATION, true );
        }
	}
	
	protected function setAuth(&$curlHandle)
	{
		if ($this->username !== null && $this->password !== null)
		{
			curl_setopt($curlHandle, CURLOPT_HTTPAUTH, CURLAUTH_DIGEST);
			curl_setopt($curlHandle, CURLOPT_USERPWD, $this->username . ':' . $this->password);
		}
	}
	
	public function getAcceptType()
	{
		return $this->acceptType;
	} 
	
	public function setAcceptType($acceptType)
	{
		$this->acceptType = $acceptType;
	} 
	
	public function getPassword()
	{
		return $this->password;
	} 
	
	public function setPassword($password)
	{
		$this->password = $password;
	} 
	
	public function getResponseBody()
	{
		return $this->responseBody;
	} 
	
	public function getResponseInfo()
	{
		return $this->responseInfo;
	} 
	
	public function getUrl()
	{
		return $this->url;
	} 
	
	public function setUrl($url)
	{
		$this->url = $url;
	} 
	
	public function getUsername()
	{
		return $this->username;
	} 
	
	public function setUsername($username)
	{
		$this->username = $username;
	} 
	
	public function getVerb()
	{
		return $this->verb;
	} 
	
	public function setVerb($verb)
	{
		$this->verb = $verb;
	}

}
