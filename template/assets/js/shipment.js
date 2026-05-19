class ShipmentForm{
    saving = false;
    init(options) {
        this.form = options.form;
        this.isTemplate = this.form.find('[name="save-as-template"]').length > 0;
        this.senderPointNode = this.form.find('fieldset[name="sender-point"]').attr('disabled',true).hide();
        this.recipientPointNode = this.form.find('fieldset[name="recipient-point"]').attr('disabled',true).hide();
        this.inputs = this.form.find(':input');
        this.options = this.form.find('.additional-services fieldset input[type=checkbox]');
        this.options.change(this.optionToggled.bind(this));
        const parcels = this.form.find('.parcels .parcel');
        parcels.not(parcels[0]).each(function(index,node){
            this.addParcelRemoveButton($(node));
        }.bind(this));
        this.inputs.filter('[name=add-shipment-item]').click(this.addNewParcel.bind(this));
        this.form.find('[name=dispatchDate], .parcels .parcel :input, [name=parcel-type], [name=dispatchMethod],[name=deliveryMethod]').change(this.loadServices.bind(this));
        this.form.find( "[name$='.postcode'],[name$='.country']" ).unbind('change').change(this.loadServices.bind(this));
        this.form.find('[name=remove-parcel').each(function(index,node){
            $(node).click(this.removeParcel.bind(this, $(node).parents('.parcel').eq(0)));
        }.bind(this));
        this.form.find('.point-search').autocomplete({
            source: function(request, response) {
                const carrier = this.form.find('[name=carrier]:checked').parent().data('service').carrier.code;
                $.ajax({
                    url: '/pickup-points/query',
                    method: 'post',
                    contentType: 'application/json',
                    headers: {
                        accept: 'application/json'
                    },
                    data: JSON.stringify({
                        text: request.term,
                        carrier: carrier,
                    }),
                    //dataType: "json",
                    /*data: {
                        query : request.term,//the value of the input is here
                        language : $('#lang-type').val(), //you can even add extra parameters
                        token : $('#csrf_token').val()
                    },*/
                    success: function(r, res){
                        const out = [];
                        for (const point of res.points) {
                            let label = point.street ?? '';
                            label = label + ' ' + (point.building ?? '');
                            if (point.hasOwnProperty('apartment')) {
                                label = label + ' ' + point.apartment;
                            }
                            label = label + ', '+point.postcode + ' ' + point.city + ' ('+point.code + ')';
                            out.push({
                                code: point.code,
                                value: label,
                                label: label,
                            });
                        }
                        r(out);
                    }.bind(this, response) //response is a callable accepting data parameter. no reason to wrap in anonymous function.
                });
            }.bind(this),
            minLength: 3,
            select: function(event, ui) {
                $(event.target).parents('fieldset').eq(0).find('.point-code').val(ui.item.code);
            }.bind(this),
        });
        this.form.find('[name=map-point-select]').click(this.openPointSelect.bind(this));
        if (this.form.find('[name=parcel-type]:checked').length === 0) {
            this.form.find('[name=parcel-type][value=parcel]').prop('checked', true);
            this.shipmentTypeChanged();
        }
        this.form.find('[name=parcel-type]').change(this.shipmentTypeChanged.bind(this));
        this.form.find('[name=carrier]').change(this.serviceChanged.bind(this));
        this.form.show();
        this.form.submit(this.save.bind(this));
        this.form.find('[name=draft]').click(this.saveDraft.bind(this));
        this.form.find('[name=save-as-template2]').click(this.saveAsTemplate.bind(this));
        this.form.find('[name=dispatchDate]').datepicker({
            dateFormat: 'yy-mm-dd'
        });
        if (this.form.find('[name=dispatchDate]').val()==='') {
            this.form.find('[name=dispatchDate]').val(new Date().toISOString().substring(0,10));
        }
        this.inputs.filter('[name="options.cod.amount"]').change(this.amountChanged.bind(this,'cod'));
        this.inputs.filter('[name="options.insurance.amount"]').change(this.amountChanged.bind(this,'insurance'));
        this.form.find('.additional-services').find(':input').change(this.loadServices.bind(this));
        this.inputs.filter('[name=select-address]').click(this.openContactsModal.bind(this));
        this.loadServices();
        if (typeof originShipment === 'object' && originShipment.hasOwnProperty('options')) {
            for( const option in originShipment.options ) {
                const value = originShipment.options[option];
                this.inputs.filter('[name="options.'+option+'.enabled"]').prop('checked', true);
                if (value.hasOwnProperty('amount')) {
                    this.inputs.filter('[name="options.'+option+'.amount"]').val(value.amount);
                }
            }
        }
    }

    shipmentTypeChanged(){
        const type = this.form.find('[name=parcel-type]:checked').val();
        const dims = this.getDimensions(type);
        const target = this.form.find('.parcels .parcel').eq(0);
        target.find("[name$='length']").val(dims.length);
        target.find("[name$='width']").val(dims.width);
        target.find("[name$='height']").val(dims.height);
        target.find("[name$='weight']").val(dims.weight);
        this.loadServices();
    }

    getDimensions(type) {
        let dims = null;
        if (type === 'pallet') {
            dims = [120, 80, 60, 50];
        } else if (type === 'parcel') {
            dims = [30, 20, 10, 1];
        } else if (type === 'envelope') {
            dims = [30, 20, 2, 1];
        } else {
            throw "Nieobsługiwany typ przesyłki";
        }
        return {
            length: dims[0],
            width: dims[1],
            height: dims[2],
            weight: dims[3],
        };
    }

    setPoint(point) {
        this.pointTarget.find('input.point-code').val(point.code);
        this.pointTarget.find('input.point-search').val(point.name);
        $('div.modal.point-select-modal').modal('hide').remove();
    }

    openContactsModal(e){
        e.preventDefault();
        const input = $(e.target);
        this.openAddressSelect(input);
        return false;
    }
    loadFromContacts(e){
        const id = $(e.target).val();
        $.ajax({
            url: '/api/contacts/' +id,
            headers: {
                accept: 'application/json'
            },
            method: 'GET',
            success:this.addressLoaded.bind(this,e.target),
        });
    }

    addressLoaded(node, res){
        node = $(node).parents('.col-md-6').eq(0);

        let inputs = node.find(':input');
        for (let i=0,l=inputs.length; i<l; i++) {
            if (inputs[i].name === 'toaddressbook[]') {
                continue;
            }
            name = inputs[i].name.split('.').at(-1);
            let value = res.contact[name] ?? '';
            if (name === 'country') {
                value = value.iso;
            }
            inputs[i].value = value;
        }
        this.loadServices();
        //console.log(node,res);
    }

    amountChanged(e) {
        const codAmount = this.inputs.filter('[name="options.cod.amount"]:visible').eq(0).val()*1;
        const insAmount = this.inputs.filter('[name="options.insurance.amount"]:visible').eq(0).val()*1 ?? 0;

        if (codAmount > 0) {
            const input = this.inputs.filter('[name="options.insurance.enabled"]');
            input.parents('.col-md-6').eq(0).find('fieldset, input').removeAttr('disabled');
            input.prop('checked', true);
            if (codAmount > insAmount || isNaN(insAmount)) {
                this.inputs.filter('[name="options.insurance.amount"]').val(codAmount);
            }
        }
        this.loadServices();
    }

    initDPDMap(node) {
        $('<script>').attr({
            id: 'dpd-widget',
            type: 'text/javascript',
        }).appendTo(node);

        $('<script>').attr({
            src: '//pudofinder.dpd.com.pl/source/dpd_widget.js?key=21f76bdf82355542ab6694a0523d6086&swip_box=1',
            type: 'text/javascript',
        }).appendTo('head');

        window.pointSelected = function(code){
            this.pointTarget.find('.point-code').val(code);
            this.pointTarget.find('.point-search').val(code);
            const modal = $('.point-select-modal');
            modal.modal('hide');
            modal.remove();
        }.bind(this);
    }
    initInPostMap(node){
        $('<inpost-geowidget onpoint="onpointselect" token="eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJzQlpXVzFNZzVlQnpDYU1XU3JvTlBjRWFveFpXcW9Ua2FuZVB3X291LWxvIn0.eyJleHAiOjIwNjM4ODI4NjgsImlhdCI6MTc0ODUyMjg2OCwianRpIjoiNGRiYzkzOWYtMDVjOC00ZmNhLWEwYjItNmU1Y2E2M2VmZjQ3IiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5pbnBvc3QucGwvYXV0aC9yZWFsbXMvZXh0ZXJuYWwiLCJzdWIiOiJmOjEyNDc1MDUxLTFjMDMtNGU1OS1iYTBjLTJiNDU2OTVlZjUzNTpsTGZST0RzUlFBUzZqTGp6NDBYdGZDNURVUG1Mekd6ejltLU85a2Z6U0swIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoic2hpcHgiLCJzZXNzaW9uX3N0YXRlIjoiNjE0NjY3M2UtOTk2NC00Y2Q0LWEyNDUtMzFjNzNlZjdjMmVjIiwic2NvcGUiOiJvcGVuaWQgYXBpOmFwaXBvaW50cyIsInNpZCI6IjYxNDY2NzNlLTk5NjQtNGNkNC1hMjQ1LTMxYzczZWY3YzJlYyIsImFsbG93ZWRfcmVmZXJyZXJzIjoiIiwidXVpZCI6IjM3YWM5ZDE2LWRlNzMtNGI4Ni1iMDFhLTJmODU1M2JmZGJlMiJ9.kl1AalUn3YRXET-FMem2jCpiqFZoge13Jb0d1RLfrF5XN_shZVj9GApXqzsLVTwiJk1uoLOYol1C3ndn_bvblNbLhgd_LY7Ka2E7dfVusa8SpkHMkmw6TrP4bNgssExz022nG4r2bb7XtuWM11nNYTXpdNcImHj-EyANGY0S5vI_UPLmfU1c5uYylARh_uex5gpScjDJ2wAaRPpiD2AicdsVP7bDYgGK21vEUKBWM85BE9s-im0lVkX2lPVI8mOvsuNWK8Sxjkkc7qB6A9LK4I9a7q3FstMFKIhrHWNvXTjBZynpdX7kVz-4Ewx5ZdUeeJau5UfjofHxUzAtchJYPg" country=\'PL\' language=\'pl\' config=\'parcelcollect\'>').appendTo(node);
        document.getElementsByTagName('head');
        $('<script>').attr({
            async: true,
            src: 'https://geowidget.inpost-group.com/inpost-geowidget.js'
        }).appendTo('head');
        document.addEventListener('onpointselect',function(e){
            const code = e.detail.name;
            const name = e.detail.address.line1 + ', ' + e.detail.address.line2 + ' (' + e.detail.name + ')';
            this.pointTarget.find('.point-code').val(code);
            this.pointTarget.find('.point-search').val(name);
            const modal = $('.point-select-modal');
            modal.modal('hide');
            modal.remove();
        }.bind(this));
    }

    initOrlenMap(node) {
        const id = Math.random().toString().replace('.','');
        this.pointTarget.find('.point-code').attr('id', 'value-'+id);
        this.pointTarget.find('.point-search').attr('id', 'label-'+id);

        $('<div class="orlen-widget" data-layout="tabs" data-target="#value-'+id+'" data-label="#label-'+id+'">').appendTo(node);
        (function (o, r, l, e, n) {
            o[l] = o[l] || [];
            var f = r.getElementsByTagName('head')[0];
            var j = r.createElement('script');
            j.async = true;
            j.src = e + 'widget.js?token=' + n + '&v=1.0.0&t=' + Math.floor(new Date().getTime() / 1000);
            f.insertBefore(j, f.firstChild);
        })(window, document, 'orlenpaczka', 'https://mapa.orlenpaczka.pl/', 'bb85fe0f99a3fa4346cbab944895d49ffe67216d5c14cac7efb97ca63d0794426f3e564d6c38e732f8c6b8b55858bdc4650530156b6c05e612bb88e0');
        document.querySelectorAll('.orlen-widget').forEach(function(widget) {
            widget.addEventListener('orlenSelectPoint', function(e) {
                const pointData = e.detail.marker.options;
                console.log(pointData);
                this.pointTarget.find('.point-code').val(pointData.id);
                const modal = $('.point-select-modal');
                modal.modal('hide');
                modal.remove();
            }.bind(this));
        }.bind(this));
    }

    updateContact(data,input,modal) {
        this.addressLoaded(input,{contact:data});
        modal.modal('hide');
        modal.remove();
    }
    updateAddressesList(input, modal, res) {
        const table = modal.find('.table-details')
        table.siblings('p').remove();
        if (res.hasOwnProperty('contacts') && res.contacts instanceof Array && res.contacts.length>0) {
            table.show();
            const tbody = table.find('tbody').empty();
            for (const contact of res.contacts) {
                $('<tr>').append(
                    $('<td>').text(contact.name),
                    $('<td>').append(
                        $('<p>').text((contact.lastname??'')+' '+(contact.firstname??'')+' '+(contact.company??'')),
                        $('<p>').text(contact.country.iso+', '+(contact.city??'')+', '+(contact.street??'')+' '+(contact.building??'')+' '+(contact.apartment??'')),
                    ),
                    $('<td>').text(contact.phone),
                    $('<td>').append(
                        $('<button class="btn btn-primary">').text("Wybierz").click(this.updateContact.bind(this, contact, input,modal)),
                    ),
                ).appendTo(tbody).data('contact', contact);
            }
        } else {
            table.hide();
            $('<p>').text("Brak dopasowań").insertAfter(table);
        }
        console.log('updateAddressesList',this,input,modal,res);
    }
    searchAddress(input, modal, e) {
        const val = e ? $(e.target).val().trim() : '';
        $.ajax({
            url: '/api/contacts',
            data: {
                query: val
            },
            success: this.updateAddressesList.bind(this, input, modal),
        });
    }
    openAddressSelect(input) {
        const src = document.getElementById('addresses-modal').innerHTML;
        const modal = $(src).appendTo('body');
        this.searchAddress(input, modal);
        modal.find('[name=query]').keyup(this.searchAddress.bind(this, input, modal));
        modal.find('.close').click(function(){
            modal.modal('hide');
            modal.remove();
        });
        modal.modal('show');
        modal.find('[name=query]').focus();
    }
    openPointSelect(e) {
        this.pointTarget = $(e.target).parents('fieldset').eq(0);
        const name = this.pointTarget[0].name.split('-')[0];
        const country = this.form.find('select[name="addresses.'+name+'.country"]').val();
        const carrier = this.form.find('[name=carrier]:checked').parent().data('service').carrier.code;
        const modal = $('<div class="modal point-select-modal" tabindex="-1" role="dialog">\n' +
            '  <div class="modal-dialog modal-dialog-centered modal-xl" role="document">\n' +
            '    <div class="modal-content">\n' +
            '      <div class="modal-header">\n' +
            '        <h5 class="modal-title">Wybierz punkt</h5>\n' +
            '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
            '          <span aria-hidden="true">&times;</span>\n' +
            '        </button>\n' +
            '      </div>\n' +
            '      <div class="modal-body">\n' +
            '        \n' +
            '      </div>\n' +
            '    </div>\n' +
            '  </div>\n' +
            '</div>').appendTo('body');

        const target = modal.find('.modal-body').css({
            margin: 0,
            padding: 0,
            height: '600px'
        });
        if (carrier === 'ORLEN') {
            this.initOrlenMap(target);
        } else if (carrier === 'INPOST') {
            this.initInPostMap(target);
        } else if (carrier === 'DPD') {
            this.initDPDMap(target);
        } else {
            $('<iframe src="/select-point?carrier=' + carrier + '&country=' + country + '" style="height:600px;">').appendTo(target).css({
                width: '100%'
            });
        }
        modal.find('.close').click(function(){
            modal.modal('hide');
            modal.remove();
        });
        modal.modal('show');
    }

    save(e, draft) {
        e.preventDefault();
        if (this.saving) {
            alert("Trwa przetwarzanie zapytania. Proszę czekać.");
            return false;
        }
        let id = this.form.find('[name=id]').val();
        let url = '/save-shipment';
        if (this.isTemplate) {
            id = this.form.find('[name="template-id"]').val();
            url = '/shipment-templates';
            if (id > 0) {
                url = url + '/' + id;
            }
        }
        id = id > 0 ? id*1 : null;
        const data = {
            shipment: this.toShipment(),
            draft: draft === true,
            id: id,
        };

        const toaddressbook = [];
        $('[name="toaddressbook[]"]:checked').each(function(index, node){
            toaddressbook.push(node.value);
        });
        if (toaddressbook.length > 0) {
            data.toaddressbook = toaddressbook;
        }
        if (this.isTemplate) {
            data.name = this.form.find('[name="template-name"]').val().trim();
            if (data.name.length < 3) {
                alert("Minimalna długość nazwy szablonu to 3 znaki");
                return false;
            }
        }

        this.saving = $.ajax({
            url: url,
            method: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            headers: {
                accept: 'application/json'
            },
            context: this,
            success: function(res){
                this.saving = false;

                const url = res?.transaction?.url;
                if (typeof url === 'string') {
                    window.location.href = url;
                    return;
                }
                const shipmentId = res.shipment?.id;
                if (shipmentId > 0) {
                    window.location.href = '/przesylki/'+shipmentId;
                } else {
                    const templateId = res.template?.id;
                    if (templateId > 0) {
                        window.location.href = '/szablony/'+templateId;
                    }
                }
            },
            error: this.unsaved.bind(this),
            complete: function(){
                console.log("KONIEC");
                this.saving = false;
            }
        })
        return false;

        return false;
    }

    saveDraft(e){
        e.preventDefault();
        return this.save(e, true);
    }

    saveAsTemplate(e){
        e.preventDefault();
        const name = prompt("Podaj nazwę szablonu").trim();
        if (name.length < 3) {
            alert("Nazwa szablonu musi mieć przynajmniej 3 znaki");
            return false;
        }

        this.saving = $.ajax({
            url: '/shipment-templates',
            method: 'POST',
            data: JSON.stringify({
                shipment: this.toShipment(),
                name : name
            }),
            contentType: 'application/json',
            headers: {
                accept: 'application/json'
            },
            context: this,
            success: function (res) {
                const tplId = res?.template?.id;
                if (tplId > 0) {
                    success("Zapisano szablon");
                } else {
                    alert("Nie udało się zapisać szablonu");
                }
            },
            error: function(){
                alert("Nie udało się zapisać szablonu");
            }
        });
        return false;
    }

    unsaved(xhr) {
        this.saving = false;
        const errors = xhr.responseJSON.errors ?? [];
        if (errors === null || errors.length === 0) {
            alert("Wystąpił błąd podczas zapisu przesyłki");
        }
        const a = errors[0];
        let b = a.message ?? a.error;
        if (b === 'ShipmentServiceRequired') {
            b = 'Wybierz usługę kurierską';
        }

        const c = a.path;
        alert( b);
    }

    serviceChanged() {
        $('.sticked .gross').empty();
        let target = this.form.find('[name=carrier]:checked');
        if (target.length === 0) {
            return;
        }
        target = target.parent();
        const service = target.data('service');
        const options = service && service.hasOwnProperty('options') ? service.options : [];

        const container = this.form.find('.additional-services').removeClass('d-none').hide();
        const inputs = this.form.find('.additional-services fieldset input[type=checkbox]');
        inputs.parents('fieldset').attr('disabled', true);
        let pickable = false;
        for (const key in options) {
            if (key === 'orderPickup') {
                pickable = true;
                continue;
            }
            const input = inputs.filter('[name="options\.'+key+'\.enabled"]');
            if (input.length === 0) {
                console.error("brak opcji "+key);
            } else {
                container.show();
                const optionLabel = input.parents('label').eq(0);
                let select = optionLabel.find('select');
                select.prop('disabled', !input.is(':checked'));
                const option = options[key];
                if (option.hasOwnProperty('options') && option.options instanceof Array) {
                    let prev = select.val();
                    select.empty();
                    if (select.length === 0) {
                        select = $('<select>').attr({
                            class: 'inline-select',
                            name: 'options.'+key+'.content'
                        }).appendTo(optionLabel).change(this.loadServices.bind(this));
                    }
                    $('<option>').appendTo(select);
                    for (const value of option.options) {
                        $('<option>').text(value.label).attr({
                            value: value.value
                        }).appendTo(select);
                    }
                    select.val(prev);
                } else if(select.length>0) {
                    select.remove();
                }
                input.parents('fieldset').removeAttr('disabled');
            }
        }
        const methods = $('[name=dispatchMethod], [name=deliveryMethod]');
        methods.parents('label').hide();
        let showMethods = false;
        if (service && service.hasOwnProperty('valuation')) {
            for (const method of service.deliveryMethods ?? []) {
                showMethods = true;
                methods.filter('[name=deliveryMethod][value="' + method.code + '"]').parents('label').show();
            }
            for (const method of service.dispatchMethods ?? []) {
                showMethods = true;
                const input = methods.filter('[name=dispatchMethod][value="' + method.code + '"]');
                input.removeData().data(method);
                const label = input.parents('label').show();
                label.find('span.comment').remove();
                if (method.hasOwnProperty('comment')) {
                    label.append($('<span class="comment">').text(method.comment));
                }
                if (method.code === 'courier' && pickable) {
                    methods.filter('[name=dispatchMethod][value="courier+pickup"]').parents('label').show();
                }
            }
            let net = 0;
            for (const item of service.valuation.items) {
                net = net + (Math.round(item.price.amount*item.quantity*100)/100);
            }
            const gross = Math.round(net*1.23*100)/100;
            $('.sticked .gross').text(this.formatNumber(gross));
        }
        if (showMethods) {
            methods.parents('.row').removeClass('d-none').show();
        } else {
            methods.parents('.row').hide();
        }

        this.checkPointsVisibility();
    }

    checkPointsVisibility(){
        const map = {
            dispatchMethod: this.senderPointNode,
            deliveryMethod: this.recipientPointNode,
        }
        for (const key in map) {
            const current = $('input[name='+key+']:checked');
            let show = current.length === 1 && ['point','locker'].indexOf(current.val()) >= 0 && current.parent().is(':visible');
            if (show) {
                const data = current.data();
                console.log('xd1', key, data);
                data.pointRequired = data.pointRequired ?? false;
                data.pointOptional = data.pointOptional ?? true;
                show = data.pointOptional || data.pointRequired;
                console.log('xd2', key, data);
            }
            console.log('tt',map[key],show);
            if (show) {
                map[key].removeClass('d-none').removeAttr('disabled').show();
            } else {
                map[key].attr('disabled', true).hide();
            }
        }

    }
    loadServices(e,inner) {
        this.checkPointsVisibility();
        if (inner !== true) {
            setTimeout(this.loadServices.bind(this,e,true), 50);
            return;
        }
        if (e) {
            const pairs = {
                'sender.postcode': 'addresses.sender.postcode',
                'recipient.postcode': 'addresses.recipient.postcode',
                'sender.country': 'addresses.sender.country',
                'recipient.country': 'addresses.recipient.country',
            };
            for (const a in pairs) {
                const b = pairs[a];
                if (e.target.name === a) {
                    this.form.find('[name="' + b + '"]').val(e.target.value);
                } else if (e.target.name === b) {
                    this.form.find('[name="' + a + '"]').val(e.target.value);
                }
            }
        }
        const shipment = this.toShipment();
        delete shipment.service;
        if (this.loading) {
            this.loading.abort();
        }
        this.loading = $.ajax({
            url: '/get-shipment-services',
            method: 'POST',
            data: JSON.stringify({shipment: shipment}),
            contentType: 'application/json',
            headers: {
                accept: 'application/json'
            },
            context: this,
            success:this.loaded,
            error:this.unloaded,
            complete:function(){
                this.loading = false;
            }
        });
    }

    getTarget(service) {
        const map = {
            'inpost:inpost_courier_express_1200': null,
            'dhl:ah': 'dhl',
            'inpost:41': null,
            'inpost:42': null,
        }
        const code = (service.carrier.code+':'+service.code).toLowerCase();
        if (map.hasOwnProperty(code)) {
            return map[code];
        }
        return code;
    }

    unloaded(xhr){
        if (xhr.statusText === 'abort') {
            return;
        }
        const error = xhr.responseJSON?.errors[0] ?? null;
        let msg = "Uzupełnij podstawowe dane o przesyłce";
        if (error && typeof error === 'object' && error.hasOwnProperty('message')) {
            msg = error.message;
        }
        this.form.find('.carriers-offers').empty().append(
            $('<p class="error">').text(msg)
        );
    }
    loaded(res) {
        const out = {};
        this.form.find('.carriers-offers > p.error').remove();
        const all = $('[name=carrier]');
        all.parents('label').hide()
        for (const services of [res.errors, res.offers]) {
            for (const service of services) {
                const target = this.getTarget(service);
                if (target === null) {
                    continue;
                }
                out[target] = service;
            }
        }

        for (const key in out) {
            if (key === 'ups:11') {
                continue;
            }
            all.filter('[value="'+key+'"]').parents('label').show();
            const service = out[key];
            let target = this.form.find('[name=carrier][value="' + key + '"]');
            if (target.length === 0) {
                target = $('<label>').append(
                    $('<div class="logo">').append(
                        $('<img src="'+service.logo.url+'">'),
                    ),
                    $('<input type="radio" name="carrier" value="' + key + '">').change(this.serviceChanged.bind(this)),
                ).appendTo(
                    this.form.find('.carriers-offers')
                );
            } else {
                target = target.parent();
                target.removeClass('disabled');
            }
            target.data('service', service);
            target.find('.logo').siblings('p').remove();
            if (service.hasOwnProperty('valuation')) {
                let net = 0;
                for (const item of service.valuation.items) {
                    net = net + (Math.round(item.price.amount*item.quantity*100)/100);
                }
                const gross = Math.round(net*1.23*100)/100;

                const p = $('<p class="price">').appendTo(target).append(
                    $('<span class="gross">').text(this.formatNumber(gross)),
                    $('<span class="gross-type">brutto</span>'),
                    $('<span class="net">').text(this.formatNumber(net)),
                    $('<span class="net-type">netto</span>')
                );
                //if (window.top.location.host === 'kurier.log4world.com') {
                    $('<span class="name" style="font-size: 13px; white-space: nowrap; font-weight: bold;">').text(service.name).prependTo(p);
                //}
            } else if (service.hasOwnProperty('error')) {
                target.addClass('disabled');
                $('<p class="error">').text(service.error.message).appendTo(target);
            }
        }

        if (this.form.find('[name=carrier]:checked').length === 0) {
            const code = originShipment?.service?.code;
            if (typeof code === 'string') {
                let originTarget = this.getTarget(originShipment.service);
                this.form.find('[name=carrier][value="'+originTarget+'"]').prop('checked', true);
            }
        }

        this.updatePaymentMethods(res.methods ?? []);
        if (this.form.find('[name=paymentMethod]:checked').length === 0) {
            const code = originShipment?.paymentMethod?.code;
            if (typeof code === 'string') {
                this.form.find('[name=paymentMethod][value="'+code+'"]').prop('checked', true);
            }
        }


        this.serviceChanged();
    }

    updatePaymentMethods(methods){

        for (const method of methods) {
            const current = this.form.find('[name=paymentMethod][value="'+method.code+'"]');
            if (current.length === 0) {
                $("<label>").append(
                    $('<input type="radio" name="paymentMethod" value="'+method.code+'">'),
                    $('<span>').text(method.name)
                ).appendTo(this.form.find('[name="payment-methods"]'));
            }
        }
    }
    formatNumber(value){
        return Number(value).toFixed(2).replace('.', ',')+' zł';
    }

    setValue(obj, path, value) {
        if (path.length === 0) {
            return value;
        }
        const key = path.shift();
        const current = obj.hasOwnProperty(key) ? obj[key] : {};
        obj[key] = this.setValue(current, path, value);
        return obj;
    }
    toShipment() {
        const input = this.toObject();
        let out = {};
        for (const key in input) {
            let value = input[key];
            let m;
            if (m = key.match(/points\.([a-z0-9]+)\.([a-z0-9]+)/i)) {
                out = this.setValue(out, ['points',m[1],m[2]], value);
            } else if (m = key.match(/options\.([a-z0-9]+)\.([a-z0-9]+)/i)) {
                if (m[2] === 'enabled') {
                    value = value > 0;
                } else if(m[2] === 'amount' && typeof value === 'string') {
                    value = value.replace(',','.') * 1;
                }
                out = this.setValue(out, ['options',m[1],m[2]], value);
            } else if (m = key.match(/addresses\.([a-z]+)\.([a-z]+)/i)) {
                if (m[2] === 'country') {
                    value = {iso: value};
                }
                out = this.setValue(out, ['addresses',m[1],m[2]], value);
            } else if (m = key.match(/parcels\[([a-z0-9\.]+)\]\.([a-z]+)/i)) {
                let path = ['parcels',m[1],m[2]];
                if (['length','width','height'].includes(m[2])) {
                    path = ['parcels',m[1],'dimensions',m[2]];
                    value = {value: value, unit: {code:'cm'}};
                } else if (m[2] === 'weight') {
                    value = {value: value, unit: {code:'kg'}};
                }
                out = this.setValue(out, path, value);
            } else if (['deliveryMethod','dispatchMethod','paymentMethod'].indexOf(key) >= 0) {
                out[key] = { code : value };
            } else if (['comment','content','dispatchDate'].indexOf(key) >= 0) {
                out[key] = value;
            } else {
                console.log(key);
            }
        }

        if (!out.hasOwnProperty('options')) {
            out.options = {};
        } else {
            for (const key of Object.keys(out.options)) {
                const enabled = out.options[key]?.enabled ?? false;
                if (!enabled) {
                    delete out.options[key];
                }
            }
        }

        if (out.options.hasOwnProperty('cod') && out.options.cod.amount>0 && !out.options.hasOwnProperty('insurance')) {
            out.options['insurance'] = {
                enabled: true,
                amount: out.options.cod.amount,
            }
        }
        if (out.dispatchMethod?.code === 'courier+pickup') {
            out.dispatchMethod.code = 'courier';
            out.options['orderPickup'] = {enabled: true};
        }
        try {
            out.service = $('[name=carrier]:checked').parent().data('service');
        } catch (e) {}
        const parcels = [];
        for (const key in out.parcels) {
            const parcel = out.parcels[key];
            parcel.nonstandard = parcel.nonstandard > 0;
            parcel.type = {code: input['parcel-type']};
            let qty = parcel.quantity ?? 1;
            if (qty<1) {
                qty = 1;
            }
            delete parcel.quantity;
            for (let i=0; i<qty; i++) {
                parcels.push(parcel);
            }
        }
        out.parcels = parcels;
        return out;
    }
    toObject() {
        const data = {};
        for (const item of this.form.serializeArray()) {
            let value = item.value.trim();
            if (value === '') {
                continue;
            }
            const type = this.form.find('[name="' + item.name + '"]')[0].type?.toLowerCase();
            if (type === 'number') {
                value = parseFloat(value);
            }
            data[item.name] = value;
        }
        return data;
    }

    removeParcel(parcel) {
        if (parcel.siblings('.parcel').length === 0) {
            alert("Musi zostać przynajmniej jedna paczka w przesyłce");
            return;
        }
        parcel.remove();
        this.loadServices();
    }

    optionToggled(e){
        const target = $(e.target);
        const checked = target.is(':checked');
        target.parents('.col-md-6').eq(0).find(':input').not(target).prop('disabled', !checked);
        this.amountChanged();
    }

    addParcelRemoveButton($node){
        const input = $node.find('[name$=\'.quantity\']');
        $('<button class="delete">').text("Usuń").click(this.removeParcel.bind(this, $node)).insertBefore(input);
    }
    addNewParcel() {
        const parcels = this.form.find('.parcels>.parcel');

        const source = parcels.eq(0)[0].outerHTML;
        const parcel = $(source);
        this.addParcelRemoveButton(parcel);
        parcel.find('[name=remove-parcel]').click(this.removeParcel.bind(this, parcel));
        parcel.find(':input').change(this.loadServices.bind(this));


        const type = this.form.find('[name=parcel-type]:checked').val();
        const dims = this.getDimensions(type);

        const parcelNum = Math.random().toString().replace('.','');
        for(const input of parcel.find(':input')) {
            name = input.name;
            const match = name.match(/\[(.*)\]/);
            if (match) {
                if (dims) {
                    for (const key in dims) {
                        if (name.endsWith('.'+key)) {
                            input.value = dims[key];
                        }
                    }
                }
                input.name = name.replace(match[1], parcelNum);
            }
        }
        parcel.insertAfter(parcels[parcels.length-1])
        this.loadServices();
    }
}

const shipmentFormObj = new ShipmentForm();
$(document).ready(function(){
    window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
        $.ajax({
            url: '/js-error',
            contentType: 'application/json',
            headers: {
                accept: 'application/json'
            },
            data: JSON.stringify({
                msg: errorMsg,
                url: url,
                line: lineNumber
            }),
        });
        return false;
    }
    window.success = function(msg) {
        alert(msg, 'success')
    }
    window.alert = function(msg, type){

        const title = type === 'success' ? 'Sukces': 'Błąd';
        const color = type === 'success' ? 'green' : 'red';
        const modal = $('<div class="modal fade" tabindex="-1" role="dialog">\n' +
            '  <div class="modal-dialog modal-dialog-centered" role="document">\n' +
            '    <div class="modal-content" style="color: '+color+'; border: 3px solid black;">\n' +
            '      <div class="modal-header">\n' +
            '        <h5 class="modal-title w-100">\n' + title + ' ' +
            '        <button type="button" class="close float-end" data-dismiss="modal" aria-label="Close">\n' +
            '          <span aria-hidden="true">&times;</span>\n' +
            '        </button></h5>\n' +
            '      </div>\n' +
            '      <div class="modal-body">\n' +
            '        \n' +
            '      </div>\n' +
            '    </div>\n' +
            '  </div>\n' +
            '</div>').appendTo('body');
        modal.find('.close').click(function(){
            this.modal('hide');
        }.bind(modal));
        modal.find('.modal-body').text(msg);
        modal.modal('show');
        modal[0].addEventListener('hidden.bs.modal', function(){
            this.remove();
        }.bind(modal));
    }
    shipmentFormObj.init({form: $('form[name=shipment]')});
    window.sform = shipmentFormObj;
});