<?php
function generateRandomString($length = 10) {
	$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$charactersLength = strlen($characters);
	$randomString = '';
	for ($i = 0; $i < $length; $i++) {
		$randomString .= $characters[rand(0, $charactersLength - 1)];
	}
	return $randomString;
}
$filename = "elements/preview_".generateRandomString(20).".html";
$previewFile = fopen($filename, "w");
fwrite($previewFile, stripcslashes($_POST['page']));
fclose($previewFile);
header('Location: '.$filename);
?>