<?php
/**
 * Created by PhpStorm.
 * User: Zanz
 * Date: 15/12/2018
 * Time: 22:37
 */

    // minimal server side validation
    // decode creates array from text
    // encode creates text from array
    $ReturnData = $_POST;

    $JsonUrl = $ReturnData["apiUrl"];
    // workaround, because file_get_contents doesnt want to work with https, and curl_init wont load
    $JsonUrl = str_replace('https', 'http', $JsonUrl);
    $JsonImages = file_get_contents($JsonUrl);
    // check if any error occurred
    if(isJson($JsonImages)){
        $ReturnData["images"] = json_decode($JsonImages);
        $ReturnData = json_encode($ReturnData);
    }else{
        $ReturnData = "ERROR"; // if api call doesnt work ( doesnt work if api itself returns error )
    }

    debug($ReturnData);
    echo $ReturnData;

    function isJson($string) {
        json_decode($string);
        return (json_last_error() == JSON_ERROR_NONE);
    }
    function debug($variable_to_debug) {
        $variable_to_debug = $variable_to_debug;
        file_put_contents('php://stderr', print_r($variable_to_debug, TRUE));
        file_put_contents('php://stderr', print_r("\n", TRUE));
    }
?>