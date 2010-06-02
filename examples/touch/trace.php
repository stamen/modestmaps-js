<?php

    if(($in = fopen('php://input', 'r')) && ($out = fopen('what.txt', 'a')))
    {
        fwrite($out, fread($in, 1024)."\n");
        fclose($in);
        fclose($out);
    }

?>