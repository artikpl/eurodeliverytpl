<?php

namespace App\Controller;

use App\Route;

#[Route('/get-shipment-services','POST')]
class GetShipmentServices extends AuthenticatedController
{
    public function __invoke()
    {
        return $this->apiQuery(
            path: '/api/get-shipment-services',
            method: 'post',
            paylaod: $this->app->jsonPayload
        );
    }
}