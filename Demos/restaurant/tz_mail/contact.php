<?php
if($_POST)
{
	/*Inlcude API configs*/
	include("api-config.php");

	//Success or Error Messages
	$msg_invalid_email_address="Please enter a valid email address.";
	$msg_invalid_api="Invalid API credentials, Please contact to site administrator for more information.";
	$msg_subscribed_success="You have successfully subscribed.";
	$msg_mailchimp_error = "Error occurred, Please contact to site administrator for more information.";
	$msg_php_email_sent="The message has been sent!";
	$msg_php_email_not_sent="The message could not been sent!";

	$purchase_email = $tz_email;
	$tz_from_email = $tz_from_email;
	$email_subject = $tz_subject;
	$g_secret_key = $g_secret_key;
	$input_values = $_POST['data']['values'];
	$input_attr = $_POST['data']['input_name'];
	$value = array_combine($input_attr,$input_values);
	$input_extra = array();
	if($value['email'])
	{
		if(filter_var($value['email'], FILTER_VALIDATE_EMAIL)){
			 $email_address = $value['email'];
		} else {
			$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_email_address));
			echo $themezaa_result;die;
		}
	}

	$skip_email = array_search($value['email'],$value);
	unset($value[$skip_email]);
	$input_extra = $value;
	$user_name = $input_extra[key($input_extra)];
	if(isset($input_extra['last_name'])){
		$last_name = $input_extra['last_name'];
	}
	if(isset($input_extra['phone'])){
		$phone_num = $input_extra['phone'];
	}
	if(isset($input_extra['comment'])){
		$comment = $input_extra['comment'];
	}
	$subscribe_email = $email_address;
	if(!empty($g_secret_key) && (!empty($value['g-recaptcha-response'])))
	{
		$google_url="https://www.google.com/recaptcha/api/siteverify";
		$secret = $g_secret_key;
		$ip = $_SERVER['REMOTE_ADDR'];
		$captcha = $value['g-recaptcha-response'];
		$captchaurl = $google_url."?secret=".$secret."&response=".$captcha."&remoteip=".$ip;
		$curl_init = curl_init();
		curl_setopt($curl_init, CURLOPT_URL, $captchaurl);
		curl_setopt($curl_init, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($curl_init, CURLOPT_TIMEOUT, 10);
		$results = curl_exec($curl_init);
		curl_close($curl_init);
		$results= json_decode($results, true);
		if($results['success'] == 1)
		{
			// API FUNCTION CALL //
				switch ($export_mail_type) 
				{
					case 'tz_aweber':
						themezaa_aweber($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api);
						break;
					case 'tz_active':
						themezaa_activecampaign($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api,$last_name,$phone_num);
						break;
					case 'tz_custom':
						themezaa_email($subscribe_email,$user_name,$last_name,$phone_num,$comment,$purchase_email,$tz_from_email,$email_subject,$msg_php_email_sent,$msg_php_email_not_sent);
						break;
					case 'tz_campain':
						themezaa_campaign($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api);
						break;
					case 'tz_response':
						themezaa_getresponse($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api);
						break;
					case 'tz_mailchimp':
						themezaa_mailchimp($subscribe_email,$user_name,$last_name,$phone_num,$comment,$msg_subscribed_success,$msg_invalid_api,$msg_mailchimp_error);
						break;
					case 'tz_mailerlite':
						themezaa_mailerlite($subscribe_email,$user_name,$last_name,$phone_num,$comment,$msg_subscribed_success,$msg_invalid_api);
						break;
					default:
						$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
						echo $themezaa_result;die;
						break;
				}
			// END API FUNCTION CALL //
		}else{

			$themezaa_result =json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
			echo $themezaa_result;die;
		}

	}else{

		// API FUNCTION CALL //
		switch ($export_mail_type) 
		{
			case 'tz_aweber':
				themezaa_aweber($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api);
				break;
			case 'tz_active':
				themezaa_activecampaign($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api,$last_name,$phone_num);
				break;
			case 'tz_custom':
				themezaa_email($subscribe_email,$user_name,$last_name,$phone_num,$comment,$purchase_email,$tz_from_email,$email_subject,$msg_php_email_sent,$msg_php_email_not_sent);
				break;
			case 'tz_campain':
				themezaa_campaign($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api);
				break;
			case 'tz_response':
				themezaa_getresponse($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api);
				break;
			case 'tz_mailchimp':
				themezaa_mailchimp($subscribe_email,$user_name,$last_name,$phone_num,$comment,$msg_subscribed_success,$msg_invalid_api,$msg_mailchimp_error);
				break;
			case 'tz_mailerlite':
				themezaa_mailerlite($subscribe_email,$user_name,$last_name,$phone_num,$comment,$msg_subscribed_success,$msg_subscribed_success,$msg_invalid_api);
				break;
			default:
				$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
				echo $themezaa_result;die;
				break;
		}
		// END API FUNCTION CALL //
	}

}
 	// API FUNCTIONS //
	function themezaa_email($subscribe_email,$user_name,$last_name=NULL,$phone_num=NULL,$comment=NULL,$purchase_email,$tz_from_email,$email_subject,$msg_php_email_sent,$msg_php_email_not_sent)
	{
		$to = $purchase_email;
		$from_email = $tz_from_email; 
		$subject = $email_subject;
		$phone_num = $phone_num;
		$comment = $comment;
		$message = "<html>
					<head>
					<title>HTML email</title>
					</head>
					<body>
					<table width='50%' border='0' align='center' cellpadding='0' cellspacing='0'>
					<tr>
					<td colspan='2' align='center' valign='top'><img style=' margin-top: 15px; ' src='http://www.themezaa.com/html/leadgen/builder/images/logo-black-big.png' ></td>
					</tr>
					<tr>
					<td width='50%' align='right'>&nbsp;</td>
					<td align='left'>&nbsp;</td>
					</tr>
					<tr>
					<td align='right' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 5px 7px 0;'>Name:</td>
					<td align='left' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 0 7px 5px;'>".$user_name."</td>
					</tr>";
					if(!empty($last_name))
					{ 
						$message .= "<tr>
							<td align='right' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 5px 7px 0;'>Last Name:</td>
							<td align='left' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 0 7px 5px;'>".$last_name."</td>
						</tr>";
					}
					$message .= "<tr>
					<td align='right' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 5px 7px 0;'>Email:</td>
					<td align='left' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 0 7px 5px;'>".$subscribe_email."</td>
					</tr>";
					
					if(!empty($phone_num))
					{ 
						$message .= "<tr>
						<td align='right' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 5px 7px 0;'>Phone Number:</td>
						<td align='left' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 0 7px 5px;'>".$phone_num."</td>
						</tr>";
					}
					if(!empty($comment))
					{ 
						$message .= "<tr>
						<td align='right' valign='top' style='border-top:1px solid #dfdfdf; border-bottom:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 5px 7px 0;'>Message:</td>
						<td align='left' valign='top' style='border-top:1px solid #dfdfdf; border-bottom:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 0 7px 5px;'>".nl2br($comment)."</td>
						</tr>";
					}
		$message .= "</table>
					</body>
					</html>";
		
		$headers  = "MIME-Version: 1.0\r\n";
		$headers .= "Content-Type: text/html; charset=ISO-8859-1\r\n";
		$headers .= 'From: <'.$from_email.'>' . "\r\n";
		$headers .= 'Reply-To: '.$subscribe_email."\r\n";
		$mail = mail($to, $subject, $message, $headers);
		if(!$mail)
		{
			$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_php_email_not_sent));
			echo $themezaa_result;die;
		}else{
			$themezaa_result = json_encode(array('type'=>'tz_message', 'text' => $msg_php_email_sent));
			echo $themezaa_result;die;
		}
	}

	function themezaa_mailchimp($subscribe_email,$user_name,$last_name=NULL,$phone_num=NULL,$comment=NULL,$msg_subscribed_success,$msg_invalid_api,$msg_mailchimp_error)
	{
		if(defined('mailchimp_api_key')	&& defined('mailchimp_api_listid'))
		{
			include('mailchimp_api/Mailchimp.php');
			$mailchimp_api_key = mailchimp_api_key;
		    $mailchimp_api_listid = mailchimp_api_listid;
		    $status = 'subscribed';
		    if(!isset($user_name)){
				$get_name = explode("@",$subscribe_email);
				$user_name = $get_name[0];
			}else{
				$user_name = $user_name;
			}
			$result = json_decode(themezaa_mailchimp_add_subscriber($subscribe_email,$status,$mailchimp_api_listid,$mailchimp_api_key,$user_name,$last_name,$phone_num,$comment));
			if( $result->status == 'subscribed' || $result->status == 'pending'){
				$themezaa_result = json_encode(array('type'=>'tz_message', 'text' => $msg_subscribed_success));
				echo $themezaa_result;die;
			}else{
				$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_mailchimp_error));
				echo $themezaa_result;die;
			}
		}else{
			$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
			echo $themezaa_result;die;
		}
	}

	function themezaa_campaign($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api)
	{
		if(defined('cm_api_key') && defined('cm_list_id'))
		{
			require_once('campaignmonitor_api/csrest_subscribers.php');
			$cm_api_key = cm_api_key;
			$cm_list_id = cm_list_id;
			if(!isset($user_name)){
				$get_name = explode("@",$subscribe_email);
				$user_name = $get_name[0];
			}else{
				$user_name = $user_name;
			}
			$wrap = new CS_REST_Subscribers($cm_list_id, $cm_api_key);
			$result = $wrap->add(array(
			    'EmailAddress' => $subscribe_email,
			    'Name' => $user_name,
			    'Resubscribe' => true
			));
			
			if($result->response == $subscribe_email) {
			    $themezaa_result = json_encode(array('type'=>'tz_message', 'text' => $msg_subscribed_success));
				echo $themezaa_result;die;
			} else {
			   	$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $result->response->Message));
				echo $themezaa_result;die;
			}
		}else{
			$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
			echo $themezaa_result;die;
		}
	}

	function themezaa_getresponse($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api)
	{
		if(defined('getresponse_api_key') && defined('getresponse_campaign_token'))
		{
			require_once('getresponse_api/GetResponseAPI3.class.php');
			$getresponse_api_key = getresponse_api_key;
			$getresponse_campaign_token = getresponse_campaign_token;
			$getresponse = new GetResponse($getresponse_api_key);
			$subscribe = $getresponse->addContact(array(
													    'name'=> $user_name,
													    'email' => $subscribe_email,
													    'dayOfCycle'=> 0,
													    'campaign' => array('campaignId' => $getresponse_campaign_token),
													    'ipAddress'=> $_SERVER['REMOTE_ADDR']
													  ));
			
			if($subscribe){
				$themezaa_result = json_encode(array('type'=>'tz_message', 'text' => $msg_subscribed_success));
				echo $themezaa_result;die;
			}else if($subscribe->httpStatus == 409){
				$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $subscribe->message)); //Already Email Exits
				echo $themezaa_result;die;
			}else{
				$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $subscribe->message));
				echo $themezaa_result;die;
			}
		}else{
			$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
			echo $themezaa_result;die;
		}
	}

	function themezaa_aweber($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api)
	{
		if(defined('aweber_list_name'))
		{
			require_once('aweber_api/aweber_api.php');
			$consumerKey = 'AkWRSxkmQ0xSDvQWjW0SowRe'; 			
			$consumerSecret = '6OzHpKuzTtGS9vPD9Bqb2heCwcVQ9MsahpS1FviV';
			$aweber_list_name = aweber_list_name; 
			$access_name = "getaccess.txt";
			$get_content = file_get_contents($access_name);
			$getaccess = json_decode($get_content);
			$accessKey = $getaccess[0];
			$accessSecret = $getaccess[1];
			$aweber = new AWeberAPI($consumerKey, $consumerSecret);
			try { 
					$get_account = $aweber->getAccount($accessKey, $accessSecret);
				    $findlists = $get_account->lists->find(array('name' =>$aweber_list_name));
					$lists = $findlists[0];
					if(!isset($user_name)){
						$get_name = explode("@",$subscribe_email);
						$user_name = $get_name[0];
					}else{
						$user_name = $user_name;
					}
				    //example: create a subscriber
				    
				    $params = array( 
				        'email' => $subscribe_email,
				        'ip_address' => $_SERVER['REMOTE_ADDR'],
				        'name' => $user_name 
				    ); 
				    $subscribers = $lists->subscribers; 
				    if(!empty($subscribers))
				    {
				    	$new_subscriber = $subscribers->create($params);
				  		$themezaa_result = json_encode(array('type'=>'tz_message', 'text' => $msg_subscribed_success));
						echo $themezaa_result;die;
				    }else{
				    	$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
						echo $themezaa_result;die;
				    }
				    
				} catch(AWeberAPIException $exc) { 

					$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $exc->message));
					echo $themezaa_result;die;
				}
				
	    }else{

	    	$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
			echo $themezaa_result;die;
		}
    }

	function themezaa_activecampaign($subscribe_email,$user_name,$msg_subscribed_success,$msg_invalid_api,$last_name=NULL,$phone_num=NULL)
	{
		if(defined('ac_api_url') && defined('ac_api_key') && defined('ac_api_listid') )
		{
			require_once('activecampaign_api/ActiveCampaign.class.php');
			$ac_api_url = ac_api_url;
			$ac_api_key = ac_api_key;
			$ac_api_listid = ac_api_listid;
			$ac = new ActiveCampaign($ac_api_url, $ac_api_key);
			$account = $ac->api("account/view");
			if(!isset($user_name)){
				$get_name = explode("@",$subscribe_email);
				$user_name = $get_name[0];
			}else{
				$user_name = $user_name;
			}
			$last_name = (isset($last_name) ? $last_name : '');
			$phone_num = (isset($phone_num) ? $phone_num : '');
			$contact = array(
								"email" => $subscribe_email,
								"first_name" => $user_name,
								"last_name" => $last_name,
								"phone" => $phone_num,
								"p[{$ac_api_listid}]" => $ac_api_listid,
								"status[{$ac_api_listid}]" => 1, // "Active" status
							);
			$contact_sync = $ac->api("contact/sync",$contact);
			if ($contact_sync->success == 1) {
				// successful request              
				$themezaa_result = json_encode(array('type'=>'tz_message', 'text' => $msg_subscribed_success ));
				echo $themezaa_result;die;
			}else{
				// request failed
				$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $contact_sync->error));
				echo $themezaa_result;die;
			}
			
		}else{

			$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
			echo $themezaa_result;die;
		}
	}


	function themezaa_mailerlite($subscribe_email,$user_name,$last_name=NULL,$phone_num=NULL,$comment=NULL,$msg_subscribed_success,$msg_subscribed_success,$msg_invalid_api)
	{

		if(defined('ml_api_key') && defined('ml_groupid'))
		{
			require_once 'mailerlite_api/Base/RestBase.php';
			require_once 'mailerlite_api/Base/Rest.php';
			require_once 'mailerlite_api/Subscribers.php';
			$ml_api_key = ml_api_key;
			$ml_groupid = ml_groupid;
			$sub_mailerlite = new MailerLite\Subscribers($ml_api_key);
			if(!isset($user_name)){
				$get_name = explode("@",$subscribe_email);
				$user_name = $get_name[0];
			}else{
				$user_name = $user_name;
			}
			$subscriber = array(
			    'email' => $subscribe_email,
			    'name' => $user_name,
			    'fields' => array( 
			       array( 'name' => 'last_name', 'value' => $last_name ),
			       array( 'name' => 'phone', 'value' => $phone_num ),
			       array( 'name' => 'comment', 'value' => $comment )
			    )
			);
			$subs_result = $sub_mailerlite->setId($ml_groupid)->add($subscriber);
			$result = json_decode($subs_result, true);
			if($result['email']){
				$themezaa_result = json_encode(array('type'=>'tz_message', 'text' => $msg_subscribed_success));
				echo $themezaa_result;die;
			}else{
				$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $result['error']['message']));
				echo $themezaa_result;die;
			}
		}else{
			$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => $msg_invalid_api));
			echo $themezaa_result;die;
		}
	}
	// END API FUNCTIONS //
?>