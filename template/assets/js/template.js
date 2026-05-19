TemplateForm = {
    ustawienia: {
        doubezpieczenie: 1,
    },
    
    domyslneKontoPobrania: '',
    swieta: {},
    
    maxPaczkaId: 0,
    iloscPaczek: 0,
    
    packEventsTH: null,
    
    blockedForm: 0,
    poprzednioWybranyKurier: 0,
    
    uliceDane: {},
    paczkomatNadawcyInit: null,
    paczkomatOdbiorcyInit: null,
    selectedHour: null,
    
    pozaUE: 0,
    
    kurierIds: {},
    
    init: function(iloscPaczek) {
        TemplateForm.iloscPaczek = parseInt(iloscPaczek);
        TemplateForm.maxPaczkaId = TemplateForm.iloscPaczek - 1;
        
        //pobranie i ubezpieczenie
        $('.additional-service-cod').click(function() {
            TemplateForm.pobranie(0);
        });
        TemplateForm.pobranie(1);
        
        $('#SzablonUsluga2On').click(function() {
            TemplateForm.ubezpieczenie(1);
        });
        TemplateForm.ubezpieczenie(0);

        $('#SzablonPobranieKwota').kotyper({onStop: function() {
            TemplateForm.pobranieUbezpieczenie(0, 0);
        }}); 
        $('#SzablonWartosc').kotyper({onStop: function() {
            TemplateForm.pobranieUbezpieczenie(0, 1);
        }}); 
        TemplateForm.pobranieUbezpieczenie(1, 0);
        
        
        //kody pocztowe
        $('#SzablonNadawcaKod').kotyper({onStop: function() {
            TemplateForm.zmienionyKod('Nadawca', '');
        }});
        $('#SzablonNadawcaKod3').kotyper({onStop: function() {
            TemplateForm.zmienionyKod('Nadawca', '3');
        }});
        $('#SzablonOdbiorcaKod').kotyper({onStop: function() {
            TemplateForm.zmienionyKod('Odbiorca', '');
        }});
        $('#SzablonOdbiorcaKod3').kotyper({onStop: function() {
            TemplateForm.zmienionyKod('Odbiorca', '3');
        }});
        TemplateForm.zmienionyKod('Nadawca', '');
        TemplateForm.zmienionyKod('Odbiorca', '');
        
        //kraje
        $('#SzablonNadawcaKraj').change(function() {
            TemplateForm.zmienionyKraj('Nadawca', '', 0);
        });
        $('#SzablonNadawcaKrajTmp').change(function() {
            TemplateForm.zmienionyKraj('Nadawca', 'Tmp', 0);
        });
        $('#SzablonOdbiorcaKraj').change(function() {
            TemplateForm.zmienionyKraj('Odbiorca', '', 0);
        });
        $('#SzablonOdbiorcaKrajTmp').change(function() {
            TemplateForm.zmienionyKraj('Odbiorca', 'Tmp', 0);
        });
        TemplateForm.zmienionyKraj('Nadawca', '', 1);
        TemplateForm.zmienionyKraj('Odbiorca', '', 1);
        
        FrontCommon.createAdvSelect('#SzablonNadawcaKraj');
        FrontCommon.createAdvSelect('#SzablonNadawcaKrajTmp');
        FrontCommon.createAdvSelect('#SzablonOdbiorcaKraj');
        FrontCommon.createAdvSelect('#SzablonOdbiorcaKrajTmp');
        
        //opakowania
        $('.add-parcel').click(function() {
            return TemplateForm.opakowanieDodaj();
        });
        $('.remove-parcel').each(function() {
            $(this).click(function() {
                return TemplateForm.opakowanieUsun($(this));
            });
        });
        TemplateForm.bindPackEvents();
        
        //formularz
        TemplateForm.ustawRodzajeWysylki(true);
        //TemplateForm.setPickupDetails();
        TemplateForm.blokadaFormularza();
        $('.telefon').change(function() {TemplateForm.wyczyscNrTelefonu($(this));});
        
        TemplateForm.ustawUslugiDodatkowe($('.kurierId:checked').val());
        $('.kurierId').click(function() {
			TemplateForm.ustawUslugiDodatkowe($(this).val());
			TemplateForm.paczkomatyInit();
        });
        
        //paczkomaty
        TemplateForm.paczkomatyInit();
        
        //podpowiedzi adresów
        TemplateForm.completeAddress('Nadawca', $('#SzablonNadawcaKod').val());
        TemplateForm.completeAddress('Odbiorca', $('#SzablonOdbiorcaKod').val());

        if($('#SzablonFakturaKod').length) {
            TemplateForm.completeAddress('Faktura', $('#SzablonFakturaKod').val());

            if($('#SzablonFakturaKod').val().length >= 5) {
                TemplateForm.getAddresses('Faktura', $('#SzablonFakturaKod').val(), $('.kurierId:checked').val(), null);
            }
        }

        if($('#SzablonOdbiorcaKod').val().length >= 5 && $('#SzablonOdbiorcaKraj').val() == 'PL') {
            TemplateForm.getAddresses('Odbiorca', $('#SzablonOdbiorcaKod').val(), $('.kurierId:checked').val(), null);
        }

        if($('#SzablonNadawcaKod').val().length >= 5 && $('#SzablonNadawcaKraj').val() == 'PL') {
            TemplateForm.getAddresses('Nadawca', $('#SzablonNadawcaKod').val(), $('.kurierId:checked').val(), null);
        }
    },
	ustawUslugiDodatkowe: function(kurierId)
    {
		if (typeof kurierId === 'undefined' || kurierId == false) {
			TemplateForm.resetujUslugi();
			return;
		}
	
        $.get(
            '/szablon/uslugi_dodatkowe/'+kurierId, 
            function(data) {
	            TemplateForm.resetujUslugi();

				if (data == undefined) {
					return;
				}
				
				Object.keys(data).forEach(function(k){
					$('#SzablonUsluga' +k+ 'On').parent().show();
				});
	            
        		$('.additional-service:hidden').prop('checked', false);
	    	}, 'json');
	},
    resetujUslugi: function() {
        $('.additional-service').parent().hide();
    },
    pobranie: function(init) {
        if($('.additional-service-cod').is(':checked')) {
            $('.cod-details').show();
            if($('#SzablonPobranieKonto').val() == '') {
                $('#SzablonPobranieKonto').val(TemplateForm.domyslneKontoPobrania);
            }
            TemplateForm.pobranieUbezpieczenie(1);
        } else {
            $('.cod-details').hide();
            $('.cod-details input[type!="radio"]').val('');
        }
    },
    ubezpieczenie: function (recznie) {
        
        if($('#SzablonUsluga2On').is(':checked'))
        {
            $('.ins-details').show();
        }
        else
        {
            if($('.additional-service-cod').is(':checked') && TemplateForm.ustawienia.doubezpieczenie)
            {
                $('#SzablonUsluga2On').prop('checked', true);
                return false;
            }
            
            $('.ins-details').hide();
            $('.ins-details input').val('');
        }
    },
    pobranieUbezpieczenie: function(init, message) {
        if(!TemplateForm.ustawienia.doubezpieczenie) {
            return;
        }
        
        if($('.additional-service-cod').is(':checked')) {
            
            if(!$('#SzablonUsluga2On').is(':checked')) {
                $('#SzablonUsluga2On').prop('checked', true);
                TemplateForm.ubezpieczenie();
            }

            if($('#SzablonPobranieKwota').val() == '') {
                pobranieKwota = 0;
            } else {
                pobranieKwota = parseFloat($('#SzablonPobranieKwota').val().replace(',', '.'));
            }
                
            if($('#SzablonWartosc').val() == '') {
                wartoscUbezpieczenia = 0;
            } else {
                wartoscUbezpieczenia = parseFloat($('#SzablonWartosc').val().replace(',', '.'));
            }
            
            if(pobranieKwota > wartoscUbezpieczenia)
            {
                $('#SzablonWartosc').val($('#SzablonPobranieKwota').val());
                if(!init && message) {
                    alert('Wartość przesyłki nie może być mniejsza niż wartość pobrania.');
                }
            }

        }
    },
    
    zmienionyKod: function(typ, nr) {
        objectPrefix = '#Szablon'+typ+'Kod';
        
		$(objectPrefix + nr).val(TemplateForm.preparePostCode($(objectPrefix + nr).val()));
        value = $(objectPrefix + nr).val();
    
        if(nr != '') {
            $(objectPrefix).val(value);
            $(objectPrefix).trigger('keyup');
        }
        if(nr != '2') {
            $(objectPrefix + '2').val(value);
        }
        if(nr != '3') {
            $(objectPrefix + '3').val(value);
        }
    
        if(typ == 'Nadawca') {
            TemplateForm.pobierzPunktyNadania();
        } else if(typ == 'Odbiorca') {
            TemplateForm.pobierzPunktyOdbioru();
        }

    },
    zmienionyKraj: function(typ, pole, init) {
        objectPrefix = '#Szablon'+typ+'Kraj';
        value = $(objectPrefix + pole).val();
        
        if($('#SzablonNadawcaKraj' + pole).val() != 'PL' && $('#SzablonOdbiorcaKraj' + pole).val() != 'PL') {
            $('#SzablonNadawcaKraj').val('PL').trigger('changedAdvSelect');
            $('#SzablonOdbiorcaKraj').val('PL').trigger('changedAdvSelect');
            $('#SzablonNadawcaKrajTmp').val('PL').trigger('changedAdvSelect');
            $('#SzablonOdbiorcaKrajTmp').val('PL').trigger('changedAdvSelect');
            alert('Można zamówić kuriera wyłącznie z Polski lub do Polski');
        } else {
            if(pole != 'Tmp') {
                $(objectPrefix + 'Tmp').val(value).trigger('changedAdvSelect');
            }

            if(pole != '') {
                $(objectPrefix + '').val(value).trigger('changedAdvSelect');
            }
        }
    },
    
    /** Obsługa wielu opakowań **/
    opakowanieDodaj: function() {
        newMaxPaczkaId = TemplateForm.maxPaczkaId+1;
        newDiv = $('.parcel:last').clone();
        oldId = $(newDiv).attr('id').replace('parcel', '');

        $(newDiv).attr('id', 'parcel' + newMaxPaczkaId);
        $(newDiv).html($(newDiv).html().replace(new RegExp('SzablonPaczka' + oldId, 'g'), 'SzablonPaczka' + newMaxPaczkaId));
        $(newDiv).html($(newDiv).html().replace(new RegExp('[[]SzablonPaczka][[]' + oldId + ']', 'g'), '[SzablonPaczka][' + newMaxPaczkaId + ']'));

        $(newDiv).children().children('.numerOpakowania').html(TemplateForm.iloscPaczek + 1);

        $(newDiv).children().children().children('.input').children('input').val('');
        $(newDiv).children().children().children('.input').children('.error-message').remove();
        $(newDiv).children().children().children('.input').children('input').removeClass('form-error');

        $('.parcels').append(newDiv);
        TemplateForm.maxPaczkaId++;
        TemplateForm.iloscPaczek++;
        $('#SzablonLiczbaPaczek').val(TemplateForm.iloscPaczek);

        $(newDiv).children('.remove-parcel').click(function() {return TemplateForm.opakowanieUsun($(this));});
        TemplateForm.setSizes();
        TemplateForm.bindPackEvents();

        return false;
    },
    opakowanieUsun: function(obj) {
        if(TemplateForm.iloscPaczek == 1) {
            return false;
        }

        paczkaDiv = $(obj).parent('.parcel');

        if($(paczkaDiv).attr('id').replace('parcel', '') == TemplateForm.maxPaczkaId) {
            TemplateForm.maxPaczkaId--;
        }

        TemplateForm.iloscPaczek--;
        $('#SzablonLiczbaPaczek').val(TemplateForm.iloscPaczek);
        $(paczkaDiv).remove();
        TemplateForm.opakowaniePrzelicz();
        TemplateForm.bindPackEvents();

        return false;
    }, 
    opakowaniePrzelicz: function() {
//        i = 1;
//        $('.parcel').each(function() {
//            $(this).children('.numerOpakowania').html(i++);
//        });
    },
    bindPackEvents: function() {
        $('input[type="text"]').keyup(function() {
            $('.obliczCeny').each(function() {
                if($(this).val() == '') {
                    return false;
                }
            });

            if($(this).attr('id') == 'SzablonNadawcaKod2' || $(this).attr('id') == 'SzablonOdbiorcaKod2') {
                return false;
            }

            if($(this).hasClass('obliczCeny')) {
                basicDataChanged = 1;
            } else {
                basicDataChanged = 0;
            }

            if(TemplateForm.packEventsTH) {
                clearTimeout(TemplateForm.packEventsTH);
            }
            TemplateForm.packEventsTH = setTimeout(function(){
                if($('.kurierId:checked').val() == 8) {
                    if(typeof(changedSenderAddress) == 'function') {
                        changedSenderAddress();
                    }
                }
            }, 800);
        });
    },
    setSizes: function() {
        rodzajWysylki = TemplateForm.pobierzRodzajWysylki();
        
        $('.parcel').each(function() {
            nrOpakowania = $(this).attr('id').replace('parcel', '');
            
            if(rodzajWysylki === 'koperta') {
                $('#SzablonPaczka'+nrOpakowania+'Waga').val('1');
                $('#SzablonPaczka'+nrOpakowania+'Dlugosc').val('35');
                $('#SzablonPaczka'+nrOpakowania+'Szerokosc').val('25');
                $('#SzablonPaczka'+nrOpakowania+'Wysokosc').val('5');

                $('#SzablonPaczka'+nrOpakowania+'Dlugosc, #SzablonPaczka'+nrOpakowania+'Szerokosc, #SzablonPaczka'+nrOpakowania+'Wysokosc')
                    .addClass('disabled').prop('readonly', true);
            } else if(rodzajWysylki === 'paleta') {
                $('#SzablonPaczka'+nrOpakowania+'Dlugosc, #SzablonPaczka'+nrOpakowania+'Szerokosc, #SzablonPaczka'+nrOpakowania+'Wysokosc')
                    .removeClass('disabled').prop('readonly', false);

                if($('#SzablonPaczka'+nrOpakowania+'Dlugosc').val() == '') {
                    $('#SzablonPaczka'+nrOpakowania+'Dlugosc').val('120');
                }
                if($('#SzablonPaczka'+nrOpakowania+'Szerokosc').val() == '') {
                    $('#SzablonPaczka'+nrOpakowania+'Szerokosc').val('80');
                }
                if($('#SzablonPaczka'+nrOpakowania+'Wysokosc').val() == '') {
                    $('#SzablonPaczka'+nrOpakowania+'Wysokosc').val('80');
                }
                if($('#SzablonPaczka'+nrOpakowania+'Waga').val() == '') {
                    $('#SzablonPaczka'+nrOpakowania+'Waga').val('51');
                }
            } else {
                $('#SzablonPaczka'+nrOpakowania+'Dlugosc, #SzablonPaczka'+nrOpakowania+'Szerokosc, #SzablonPaczka'+nrOpakowania+'Wysokosc')
                    .removeClass('disabled').prop('readonly', false);
            }
        });
    },
    
    pobierzRodzajWysylki: function() {
        if($('#SzablonRodzajWysylkiKoperta').is(':checked')) {
            return 'koperta';
        } else if($('#SzablonRodzajWysylkiPaleta').is(':checked')) {
            return 'paleta';
        } else {
            return 'paczka';
        }
    },
    ustawRodzajeWysylki: function() {
        if($('#SzablonRodzajWysylkiKoperta').is(':checked')) {
            TemplateForm.ustawRodzajWysylki('koperta');
        } else if($('#SzablonRodzajWysylkiPaleta').is(':checked')) {
            TemplateForm.ustawRodzajWysylki('paleta');
        } else if($('#SzablonRodzajWysylkiPaczka').is(':checked')) {
            TemplateForm.ustawRodzajWysylki('paczka');
        }

        $('label.SzablonRodzajWysylkiKoperta').click(function() {
            TemplateForm.ustawRodzajWysylki('koperta');
        });
        $('label.SzablonRodzajWysylkiPaczka').click(function() {
            TemplateForm.ustawRodzajWysylki('paczka');
        });
        $('label.SzablonRodzajWysylkiPaleta').click(function() {
            TemplateForm.ustawRodzajWysylki('paleta');
        });
    },
    ustawRodzajWysylki: function(rodzaj) {
        if(rodzaj == 'koperta') {
            obj = '#SzablonRodzajWysylkiKoperta';
        } else if(rodzaj == 'paleta') {
            obj = '#SzablonRodzajWysylkiPaleta';
        } else {
            obj = '#SzablonRodzajWysylkiPaczka';
        }
        
        $(obj).prop('checked', true);
        $('.rodzaj-przesylki-ikona').removeClass('zaznaczony-rodzaj-przesylki');
        $(obj).parent().parent().addClass('zaznaczony-rodzaj-przesylki');

        TemplateForm.setSizes();
    },
    
    isFirstPackageFilled: function() {
        if($('#SzablonPaczka0Waga').val() == '' && $('#SzablonPaczka0Dlugosc').val() == '' && 
              $('#SzablonPaczka0Szerokosc').val() == '' && $('#SzablonPaczka0Wysokosc').val() == '') {
                return false;
        } else {
            return true;
        }
    },
    preparePostCode: function(code) {
        code = code.replace(/ /g, '').replace(/–/g, '-');
        return code;
    },
    ustawDostepneUslugi: function (dostepneUslugi) {
        for (var id in dostepneUslugi) {
            $('#SzablonUsluga' + id + 'On').parent().show();
        }
        $('.additional-service:hidden').prop('checked', false);
    },
    
    blokadaFormularza: function() {
        $('.formularzOrder').submit(function() {
            if(TemplateForm.blockedForm)
            {
                alert('Formularz został już wcześniej wysłany. Odśwież stronę lub złóż zamówienie od początku.');
                return false;
            }

            if(confirm('Czy na pewno chcesz złożyć zamówienie?'))
            {
                TemplateForm.blockedForm = 1;
                return true;
            }
            else
            {
                return false;
            }
        });
    },
    
    wyczyscNrTelefonu: function(obj) {
        nr = $(obj).val();
        nr = nr.replace(/ /g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/-/g, '');
        $(obj).val(nr);
    },
    
    //paczkomaty
    paczkomatyInit: function() {
        if($('.kurierId:checked').val() == 6 || $('.kurierId:checked').val() == 11) {
            $('.package-points').show();
            $('#SzablonNadawcaPaczkomat, #SzablonOdbiorcaPaczkomat').kotyper('off');
        } else {
            $('.package-points').hide();
        }
        
        if($('.kurierId:checked').val() == 6) {
            $('#SzablonNadawcaKod, #SzablonNadawcaMiasto').kotyper({onStop: function() {
                TemplateForm.pobierzPunktyNadania();
            }});

            $('#SzablonOdbiorcaKod, #SzablonOdbiorcaMiasto').kotyper({onStop: function() {
                TemplateForm.pobierzPunktyOdbioru();
            }});
        }
    
        TemplateForm.pobierzPunktyNadania();
        TemplateForm.pobierzPunktyOdbioru();
    },
    
    pobierzPunktyNadania: function() {
        if($('.kurierId:checked').val() == 6) {
            TemplateForm.pobierzPaczkomatyNadaniaInpost();
        } else if($('.kurierId:checked').val() == 11) {
            TemplateForm.pobierzPunktyNadaniaOrlen();
        }
    },
    pobierzPunktyOdbioru: function() {
        if($('.kurierId:checked').val() == 6) {
            TemplateForm.pobierzPaczkomatyOdbioruInpost();
        }  else if($('.kurierId:checked').val() == 11) {
            TemplateForm.pobierzPunktyOdbioruOrlen();
        }
    },
    pobierzPaczkomatyNadaniaInpost: function() {	
        var selectedVal = $('#SzablonNadawcaPaczkomat').val();

        if(selectedVal == '') {
            selectedVal = TemplateForm.paczkomatNadawcyInit;
        }

        $.post(
            '/pudo/lista/6', 
            {
                kod: $('#SzablonNadawcaKod').val(),
                miasto: $('#SzablonNadawcaMiasto').val(),
                pobraniowe: 0
            },
            function(data) {
                $('#SzablonNadawcaPaczkomat').ajGroupedSelectOptions(data, selectedVal);
                FrontCommon.createAdvSelect('#SzablonNadawcaPaczkomat');
            }, 
            'json'
        );
    },
    pobierzPaczkomatyOdbioruInpost: function() {
        if($('.additional-service-cod').is(':checked')) {
            pobraniowe = 1;
        } else {
            pobraniowe = 0;
        }

        selectedVal = $('#SzablonOdbiorcaPaczkomat').val();
        if(selectedVal == '') {
            selectedVal = TemplateForm.paczkomatOdbiorcyInit;
        }

        $.post(
            '/pudo/lista/6', 
            {
                kod: $('#SzablonOdbiorcaKod').val(),
                miasto: $('#SzablonOdbiorcaMiasto').val(),
                pobraniowe: pobraniowe
            },
            function(data) {
                $('#SzablonOdbiorcaPaczkomat').ajGroupedSelectOptions(data, selectedVal);
                
FrontCommon.createAdvSelect('#SzablonOdbiorcaPaczkomat');
            }, 
            'json'
        );
    },
    pobierzPunktyNadaniaOrlen: function() {	
        var selectedVal = $('#SzablonNadawcaPaczkomat').val();

        if(selectedVal == '') {
            selectedVal = TemplateForm.paczkomatNadawcyInit;
        }

        tylkoPobraniowe = 0;
        /*if($('#SzablonPobranie').is(':checked'))
        {
            tylkoPobraniowe = 1;
        }*/

        $.post(
            '/pudo/lista/11/'+tylkoPobraniowe,
            function(data) {
                $('#SzablonNadawcaPaczkomat').ajGroupedSelectOptions(data, selectedVal);
                
FrontCommon.createAdvSelect('#SzablonNadawcaPaczkomat');
            }, 
            'json'
        );
    },
    pobierzPunktyOdbioruOrlen: function () {
        selectedVal = $('#SzablonOdbiorcaPaczkomat').val();

        if(selectedVal == '') {
            selectedVal = TemplateForm.paczkomatOdbiorcyInit;
        }

        tylkoPobraniowe = 0;
        if($('#SzablonPobranie').is(':checked')) {
            tylkoPobraniowe = 1;
        }

        $.post(
            '/pudo/lista/11/'+tylkoPobraniowe,
            function(data) {
                $('#SzablonOdbiorcaPaczkomat').ajGroupedSelectOptions(data, selectedVal);
                FrontCommon.createAdvSelect('#SzablonOdbiorcaPaczkomat');
            }, 
            'json'
        );
    },
    
    getAddresses: function (typ, kod, kurierId, response) {
        if($('#Szablon'+typ+'Kraj').val() != 'PL' && typ != 'Faktura') {
            return;
        }

        if(typeof kurierId === 'undefined') {
            kurierIdString = '';
        } else {
            kurierIdString = '/' + kurierId;
        }

        $.getJSON(
            '/kod/wyszukaj_adresy/'+kod+kurierIdString,
            function(data) {
                TemplateForm.uliceDane[kod] = {};
                adresy = $.map( data.adresy, function(item) {
                    if(item.Kod.ulica != '') {
                        if(!TemplateForm.uliceDane[kod]) {
                            TemplateForm.uliceDane[kod] = {};
                        }
                        if(!TemplateForm.uliceDane[kod][item.Kod.miejscowosc]) {
                            TemplateForm.uliceDane[kod][item.Kod.miejscowosc] = [];
                        }
                        TemplateForm.uliceDane[kod][item.Kod.miejscowosc].push(item.Kod.ulica);
                    }
                    return {
                        label: item.Kod.miejscowosc,
                        value: kod,
                        ulica: item.Kod.ulica,
                        miejscowosc: item.Kod.miejscowosc
                    }
                });
                if(jQuery.isFunction(response)) {
                    response(adresy);
                }
                if(!$.isEmptyObject(data.miasta)) {
                    var miastaSelect = $('<select id="Szablon'+typ+'Miasto" name="data[Szablon]['+typ.toLowerCase()+
                        '_miasto]" style="width:170px;"><option value="">-wybierz-</option></select>');

                    $.each(data.miasta, function(key, value) {   
                        $(miastaSelect).append($("<option></option>").attr("value", key).text(value)); 
                    });

                    miastoVal = $('#Szablon'+typ+'MiastoTmp').val();
                    if (miastoVal !== undefined) {
                        $('#Szablon'+typ+'MiastoTmp').val('');
                        if(miastoVal == '') {
                            miastoVal = $('#Szablon'+typ+'Miasto').val();
                        }

                        $('#Szablon'+typ+'Miasto').unbind('change');

                        if(miastoVal !== '') {
                            $('#Szablon'+typ+'Miasto').val(miastoVal.toUpperCase());
                        }
                    }
                } else {
    //				$('#Szablon'+typ+'Miasto').replaceWith(
    //						'<p id="Szablon'+typ+'Miasto">Brak miejscowości dla wprowadzonego kodu</p>');
                }
            }
        );
    },
    completeAddress: function (typ, kod) {
        $('#Szablon' + typ + 'Kod').autocomplete({
            source: function(request, response) {
                kurierId = $('.kurierId:checked').val();
                if(typeof kurierId == 'undefined') {
                    kurierId = 0;
                }
                if($('#Szablon' + typ + 'Kod').val().replace('-', '').length == 5) {
                    TemplateForm.getAddresses(typ, $('#Szablon' + typ + 'Kod').val(), kurierId, response);
                }
            },
            minLength: 5,
            select: function(event, ui) {
                $('#Szablon' + typ + 'Miasto').val(ui.item.miejscowosc);
                return false;
            }
        }).focus(function() {
            if($(this).autocomplete("widget").is(":visible")) {
                return;
            }

            $('#Szablon' + typ + 'Kod').autocomplete('search');
        });
    },
    
    addMessage: function(inputObj, text) {
        if($(inputObj).parent('div').children('.error-message').length > 0) {
            $(inputObj).parent('div').children('.error-message').html(text);
        } else {
            $(inputObj).parent('div').addClass('error');
            $(inputObj).parent('div').append('<div class="error-message">'+text+'</div>');
        }
    },
    removeMessages: function () {
        $('#mainError').html('').hide();
        $('.order-form-summary-message').html('');
        $('.price-box-message').html('').hide();
        $('.parcels input .error').removeClass('error');
        $('.parcels .error-message').remove();
    },
    
    updateFormConfiguration(settings) {
        TemplateForm.ustawienia = $.extend({
            'doubezpieczenie': 1,
        }, setting);
    },
};