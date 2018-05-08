<?php
$return = [];

if( isset($_POST['data']) && $_POST['data'] != '' ) {

	if( isset($_POST['data']['delete']) ) {

		$myfile = fopen("site.json", "w");
		fwrite($myfile, '{}');
		fclose($myfile);

	} else {

		$myfile = fopen("site.json", "w");
		fwrite($myfile, json_encode($_POST['data']));
		fclose($myfile);

	}

	$return['responseCode'] = 1;
	$return['responseHTML'] = '<h5>Hooray!</h5> <p>The site was saved successfully!</p>';

} else {

	$return['responseCode'] = 0;
	$return['responseHTML'] = '<h5>Ouch!</h5> <p>Something went wrong and the site could not be saved :(</p>';

}
echo json_encode($return);
?>