<?php

namespace App\Controller;

use App\App;
use App\Curl;
use App\CurlResponse;
use App\Twig;
use Twig\Environment;

abstract class Controller
{
    protected ?\stdClass $session;
    public Twig $twig {
        get {
            return $this->app->twig;
        }
    }
    public function __construct(
        protected App $app
    )
    {
        if (!empty($_SESSION['access_token'])) {
            $this->session = (object)[
                'token' => $_SESSION['access_token'],
            ];
        }
    }

    public function isLoggedIn(): bool
    {
        return !empty($_SESSION['access_token']);
    }

    public function getAccount(): \stdClass
    {
        if (!$this->isLoggedIn()) {
            http_response_code(401);
            header("Location: /logowanie" . $this->app->path);
            exit;
        }
        return $this->apiQuery('/me')->json->party;
    }

    public function apiQuery(
        string $path,
        string $method = 'GET',
        array|\stdClass|null $paylaod = null,
    ): CurlResponse{
        $curl = new Curl();
        $headers = [
            'accept' => 'application/json',
        ];
        if (!empty($_SESSION['access_token'])) {
            $headers['Authorization'] = 'Bearer ' . $_SESSION['access_token'];
        }
        return $curl->execute(
            url: 'https://' . $this->app::API_ENDPOINT . $path,
            method: strtoupper($method),
            payload: $paylaod,
            headers: $headers,
        );
    }

    protected function addNotification(string $message): void
    {
        $notifications = $_SESSION['notifications'] ?? [];
        $notifications[] = $message;
        $_SESSION['notifications'] = $notifications;
    }

    protected function addError(string $message): void
    {
        $errors = $_SESSION['errors'] ?? [];
        $errors[] = [
            'message' => $message,
        ];
        $_SESSION['errors'] = $errors;
    }
}