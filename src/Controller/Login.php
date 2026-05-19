<?php

namespace App\Controller;

use App\Curl;
use App\Route;

#[Route('/logowanie','POST')]
#[Route('/logowanie/(?<rest>.*)','POST')]
class Login extends Controller
{
    public function __invoke()
    {
        $curl = new Curl();
        $res = $curl->execute(
            url: 'https://kurier.log4world.com/oauth/token',
            method: 'POST',
            payload: http_build_query([
                'grant_type' => 'password',
                'username' => $_POST['login'],
                'password' => $_POST['password']
            ])
        );

        $redirect = $_SERVER['HTTP_REFERER'];
        if ($res->code === 200 && !empty($res->json->access_token)) {
            $_SESSION['access_token'] = $res->json->access_token;
            $redirect = $_POST['redirect'] ?? '/';
        } elseif (!empty($res->json->error_description)) {
            $error = $res->json->error_description;
        } else {
            $error = "Wystąpił błąd podczas logowania";
        }

        if (!empty($error)) {
            $_SESSION['errors'] = [['message' => $error]];
        }
        header("Location: ".$redirect);
        exit;
    }
}