<?php

namespace App;

use JsonException;

class Curl
{
    private $curl;
    public function __construct()
    {
        $this->curl = curl_init();
        curl_setopt_array($this -> curl, [
            CURLINFO_HEADER_OUT => 1,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
            CURLOPT_COOKIEFILE => '',
            CURLOPT_ENCODING => 'gzip, deflate',
            CURLOPT_HEADER => 1,
            CURLOPT_AUTOREFERER => 1,
            CURLOPT_RETURNTRANSFER => 1,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_FOLLOWLOCATION => 0
        ]);
    }
    public function execute(
        ?string $url = null,
        ?string $method = null,
        null|string|array|\stdClass $payload = null,
        ?array $headers = null,
    ): CurlResponse
    {
        $options = [];
        if (!empty($url)) {
            $options[CURLOPT_URL] = $url;
        }
        if (!empty($method)) {
            $options[CURLOPT_CUSTOMREQUEST] = $method;
        }
        if (!empty($payload)) {
            if (!is_string($payload)) {
                $payload = json_encode($payload);
            }
            $options[CURLOPT_POSTFIELDS] = $payload;
        }
        if (!empty($headers)) {
            foreach ($headers as $header => $value) {
                $headers[] = $header . ': ' . $value;
            }
            $options[CURLOPT_HTTPHEADER] = $headers;
        }
        if (!empty($options)) {
            curl_setopt_array($this -> curl, $options);
        }
        $res = curl_exec($this -> curl);
        list($header, $body) = explode("\r\n\r\n", $res, 2);
        try {
            $json = json_decode(json: $body, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
        }
        $info = curl_getinfo($this -> curl);
        return new CurlResponse(
            code: $info['http_code'],
            json: $json ?? null,
            body: $body ?? null,
            type: $info['content_type'] ?? null,
        );
    }
}