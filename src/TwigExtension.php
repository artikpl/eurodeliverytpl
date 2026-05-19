<?php

namespace App;

use Twig\Extension\ExtensionInterface;
use Twig\TwigFunction;

/**
 * @method array<ExpressionParserInterface> getExpressionParsers()
 */
class TwigExtension implements ExtensionInterface
{

    public function getTokenParsers()
    {
        return [];
    }

    public function getNodeVisitors()
    {
        return [];
    }

    public function getFilters()
    {
        return [];
    }

    public function getTests()
    {
        return [];
    }

    public function getFunctions()
    {
        $functions = [
            'getEuCountries',
            'getSystemName',
            'hasErrors',
            'getErrors',
            'flushErrors',
            'toArray',
            'date',
            'round',
            'hasNotifications',
            'getNotifications',
            'flushNotifications',
            'pointName',
            'time',
            'isset',
            'number_format',
            'empty',
            'iban2local',
        ];
        return array_map(function(string $name): TwigFunction{
            if (method_exists($this, $name)) {
                return new TwigFunction($name, [$this,$name]);
            }
            return new TwigFunction($name, function() use ($name){
                return call_user_func_array($name, func_get_args());
            });
        }, $functions);
    }

    public function getOperators()
    {
        return [[],[]];
    }

    public function __call(string $name, array $arguments)
    {
        // TODO: Implement @method array<ExpressionParserInterface> getExpressionParsers()
    }

    function iban2local($var){
        if (is_string($var) && str_starts_with($var, 'PL')) {
            $iban = implode(' ', str_split($var, 4));
            $iban = substr($iban, 2);
            return $iban;
        }
        return $var;
    }

    public function getEuCountries($default): array
    {
        $countries = [
            'AT' => 'Austria',
            'BE' => 'Belgia',
            'BG' => 'Bułgaria',
            'HR' => 'Chorwacja',
            'CY' => 'Cypr',
            'CZ' => 'Czechy',
            'DK' => 'Dania',
            'EE' => 'Estonia',
            'FI' => 'Finlandia',
            'FR' => 'Francja',
            'GR' => 'Grecja',
            'ES' => 'Hiszpania',
            'NL' => 'Holandia',
            'IE' => 'Irlandia',
            'LT' => 'Litwa',
            'LU' => 'Luksemburg',
            'LV' => 'Łotwa',
            'MT' => 'Malta',
            'DE' => 'Niemcy',
            'PL' => 'Polska',
            'PT' => 'Portugalia',
            'RO' => 'Rumunia',
            'SK' => 'Słowacja',
            'SI' => 'Słowenia',
            'SE' => 'Szwecja',
            'HU' => 'Węgry',
            'IT' => 'Włochy',
        ];

        foreach ($countries as $iso => $name) {
            $countries[$iso] = [
                'iso' => $iso,
                'name' => $name
            ];
        }
        $default = array_key_exists($default ?? '', $countries) ? $default : 'PL';
        $countries[$default]['selected'] = true;
        return array_values($countries);
    }

    function getSystemName(): string
    {
        return 'EuroDelivery';
    }

    function isset($var): bool
    {
        return !empty($var);
    }

    function empty($var): bool
    {
        return empty($var);
    }

    function hasErrors(): bool
    {
        return count($_SESSION['errors'] ?? []) > 0;
    }

    function getErrors(): ?array
    {
        return $_SESSION['errors'] ?? null;
    }

    function flushErrors(): void
    {
        unset($_SESSION['errors']);
    }

    function hasNotifications(): bool
    {
        return count($_SESSION['notifications'] ?? []) > 0;
    }

    function getNotifications(): ?array
    {
        return $_SESSION['notifications'] ?? null;
    }

    function flushNotifications(): void
    {
        unset($_SESSION['notifications']);
    }

    public function pointName($var): ?string
    {
        if (empty($var)) {
            return null;
        }
        $parts = [];
        if (!empty($var->street)) {
            $out = $var->street;
            if (!empty($var->building)) {
                $out .= " {$var->building}";
                if (!empty($var->apartment)) {
                    $out .= "/{$var->apartment}";
                }
            }
            $parts[] = $out;
        }

        $part = trim(($var->postcode ?? '').' '.($var->city ?? ''));
        if (!empty($part)) {
            $parts[] = $part;
        }

        $code = $var->code ?? null;
        if (!empty($code)) {
            if (empty($parts)) {
                return $code;
            }
            $parts[] = "({$code})";
            return implode(', ', $parts);
        }

        return $code;
    }

    public function toArray(?\stdClass $object): array
    {
        return is_null($object) ? [] : get_object_vars($object);
    }
}