<?php

namespace App\Controller;

use App\Route;

#[Route('/get-shipment-price', 'POST')]
class GetLowestPrice extends Controller
{
    public function __invoke()
    {
        return $this->apiQuery(
            path: '/api/get-lowest-price',
            method: 'post',
            paylaod: $this->app->jsonPayload
        );
    }
}