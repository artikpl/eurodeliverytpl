<?php

namespace App;

use App\Controller\AuthenticatedController;
use JsonException;
use ReflectionClass;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;

class App
{
    const string API_ENDPOINT = 'kurier.log4world.com';
    public readonly string $path;
    public readonly array $query;
    public readonly string $method;
    public readonly null|\stdClass|array $jsonPayload;
    public \stdClass $session;

    public function getSession(): ?\stdClass
    {
        if (empty($_SESSION['access_token'])) {
            return null;
        }
        if (isset($this->session)) {
            return $this->session;
        }
        $curl = new Curl();
        $res = $curl->execute(
            url: 'https://' . self::API_ENDPOINT . '/api/me',
            headers: [
                'authorization' => 'Bearer ' . $_SESSION['access_token'],
            ],
        );
        if ($res->code === 200 && !empty($res->json->party->id)) {
            $this->session = $res->json;
            return $this->session;
        }
        $_SESSION['access_token'] = null;
        return null;
    }
    public Twig $twig {
        get {
            $this->twig = $this->twig ?? new Twig(
                loader: new FilesystemLoader("template"),
                app: $this
            );
            return $this->twig;
        }
    }
    public function __construct()
    {
        $pu = parse_url($_SERVER['REQUEST_URI'] ?? '');
        $this->path = $pu['path'] ?? '';
        $query = [];
        if (!empty($pu['query'])) {
            parse_str($pu['query'], $query);
        }
        $this->query = $query;
        $this->method = $_SERVER['REQUEST_METHOD'] ?? '';
        $payload = file_get_contents('php://input');
        if (!empty($payload)) {
            try {
                $this->jsonPayload = json_decode($payload);
            } catch (JsonException $e) {}
        }
    }

    private function getRoutes(): array
    {
        $out = [];
        foreach (glob('src/Controller/*.php') as $file) {
            $filename = pathinfo($file, PATHINFO_FILENAME);
            $reflection = new ReflectionClass('App\\Controller\\' . $filename);
            if ($reflection->isAbstract() || !$reflection->hasMethod('__invoke')) {
                continue;
            }

            $routes = $reflection->getAttributes(Route::class);

            foreach ($routes as $route) {
                $route = $route->newInstance();
                if (preg_match('@' . $route->path . '@', $this->path, $o) !== 1 || $o[0] !== $this->path) {
                    continue;
                }
                $out[$route->method] = [$reflection, $o];
            }
        }
        return $out;
    }
    public function __invoke()
    {
        $routes = $this->getRoutes();
        if (empty($routes)) {
            print_r($_SERVER);
            exit;
            http_response_code(404);
            exit;
        }
        $route = $routes[$this->method] ?? null;
        if (empty($route)) {
            http_response_code(405);
            exit;
        }

        list($reflection, $o) = $route;
        $object = $reflection->newInstance($this);
        if ($object instanceof AuthenticatedController && empty($this->getSession())) {
            header("Location: /logowanie" . $this->path);
            exit;
        }
        $response = $object($o);
        if ($response instanceof CurlResponse) {
            http_response_code($response->code);
            header('Content-Type: ' . $response->type);
            echo $response->body;
            exit;
        }
        if (is_string($response)) {
            echo $response;
        } else {
            var_dump($response);
            die(__FILE__.__LINE__);
        }
    }
}