<?php

namespace App\Controller;

use App\Route;

#[Route('/proceed-shipment','POST')]
class ProceedFrontShipment extends Controller
{
    public function __invoke(){
        $_SESSION['shipment'] = $this->app->jsonPayload->shipment;
        return [
            'ok' => true,
        ];
    }
}