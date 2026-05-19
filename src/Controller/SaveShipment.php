<?php

namespace App\Controller;

use App\Route;

#[Route('/save-shipment','POST')]
class SaveShipment extends AuthenticatedController
{
    public function __invoke()
    {
        $res = $this->apiQuery('/api/shipments','post',$this->app->jsonPayload);
        return $res;
    }
}