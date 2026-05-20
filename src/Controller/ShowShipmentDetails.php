<?php

namespace App\Controller;

use App\Route;

#[Route('/przesylki/(?<id>[0-9]+)','GET')]
class ShowShipmentDetails extends AuthenticatedController
{
    public function __invoke(array $vars)
    {
        $res = $this->apiQuery('/api/shipments/' . $vars['id'],'get');
        if (isset($res->json->shipment->id)) {
            return $this->twig->render('shipment-details.twig', [
                'shipment' => $res->json->shipment,
            ]);
        }
        $this->addError("Nie znaleziono przesyłki");
        header("Location: /przesylki/wyslane");
        exit;
    }
}