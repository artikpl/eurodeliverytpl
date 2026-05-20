<?php

namespace App\Controller;

use App\Route;

#[Route('/przesylki/(?<id>[0-9]+)/edycja','GET')]
class ShowEditShipment extends AuthenticatedController
{
    public function __invoke(array $vars)
    {
        $res = $this->apiQuery('/api/shipments/' . $vars['id']);
        $shipment = $res->json->shipment ?? null;
        if (empty($shipment)) {
            $this->addError('Nie znaleziono przesyłki');
            header("Location: /przesylki/robocze");
            exit;
        }

        if (!empty($shipment->waybill)) {
            $this->addError('Nie można edytować zarejestrowanej przesyłki');
            header("Location: /przesylki/wyslane");
            exit;
        }
        return $this->twig->render('new-shipment.twig', [
            'sender' => $shipment->addresses->sender ?? null,
            'shipment' => $shipment,
            'recipient' => $shipment->addresses->recipient ?? null,
        ]);
    }
}