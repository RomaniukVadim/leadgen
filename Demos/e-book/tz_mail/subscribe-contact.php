<?php
  if(isset($_POST['data']['email'])){
	  
	$from = $_POST['data']['email'];

	// Email Receiver Address
	$receiver ="info@yourdomain.com";
	$from_email = "noreply@yourdomain.com"; 
	$subject = "Contact form details";
	
 	$message = "
	<html>
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
	<td align='right' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 5px 7px 0;'>Email:</td>
	<td align='left' valign='top' style='border-top:1px solid #dfdfdf; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000; padding:7px 0 7px 5px;'>".$from."</td>
	</tr>
	</table>
	</body>
	</html>
	";
	// Always set content-type when sending HTML email
	$headers = "MIME-Version: 1.0" . "\r\n";
	$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
	// More headers
	$headers .= 'From: <'.$from_email.'>' . "\r\n";
	$headers .= 'Reply-To: '.$from."\r\n";
   if(mail($receiver,$subject,$message,$headers))  
   {
	   //Success Message
	   	$themezaa_result = json_encode(array('type'=>'tz_message', 'text' => 'The message has been sent!'));
		echo $themezaa_result;die;
	}else{

   		//Fail Message
      	$themezaa_result = json_encode(array('type'=>'tz_error', 'text' => 'The message could not been sent!'));
		echo $themezaa_result;die;
	}

}
?>
