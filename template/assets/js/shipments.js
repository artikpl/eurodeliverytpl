class Shipments {
    modal = null;
    init(){
        $('[data-delete_id]').click(this.delete.bind(this));
        $('[name=check-all]').click(this.toggleAll.bind(this));
        $('[name=download-labels]').show().click(this.downloadLabels.bind(this, 'label'));
        $('[name=download-protocol]').show().click(this.downloadLabels.bind(this, 'protocol'));
        $('[name="create-consolidation"]').show().click(this.registerConsolidation.bind(this))
        $('[name=register-shipments]').show().click(this.registerShipments.bind(this));
        if (app && app.socket) {
            app.socket.on('shipmentPriceChanged', this.shipmentPriceChanged.bind(this));
            app.socket.on('shipmentRegistered', this.shipmentRegistered.bind(this));
            app.socket.on('shipmentError', this.shipmentError.bind(this));
        }
    }

    delete(e) {
        const id = $(e.target).data('delete_id');
        if (confirm("Czy chcesz usunąć przesyłkę "+id)) {
            $.ajax({
                url: '/api/shipments/'+id,
                method: 'delete',
                success: function(){
                    $(this).parents('tr').eq(0).fadeOut({
                        complete: function(e){
                            console.log('x',this,e);
                            $(this).remove();
                        }
                    });
                }.bind(e.target)
            })
        }
    }
    getModal(id) {
        if (typeof id !== 'string' || document.getElementById(id) == null) {
            id = 'empty-modal';
        }
        if (this.modal === null) {
            this.modal = $(document.getElementById(id).innerHTML);
            this.modal.appendTo('body');
        }
        return this.modal;
    }

    getIds(){
        let ids = [];
        const inputs = $('input[name="ids[]"]:checked');
        for (let i=0,l=inputs.length;i<l;i++) {
            ids.push(inputs[i].value*1);
        }
        return ids;
    }

    toggleAll(){
        const checked = $('[name=check-all]').is(':checked');
        $('input[name="ids[]"]').prop('checked', checked);
    }

    getShipmentRow(id){
        const input = $('input[name="ids[]"][value="'+id+'"]:checked');
        if (input.length === 0) {
            return null;
        }
        const row = input.parents('tr').eq(0);
        if (row.length === 0) {
            return null;
        }
        return row;
    }

    shipmentError(shipment){
        const row = this.getShipmentRow(shipment.id);
        if (row === null) {
            return null;
        }
        const p = row.find('p.shipment-error').empty().show();
        if (shipment.hasOwnProperty('errors')) {
            const list = $('<ul>').appendTo(p);
            for (const e of shipment.errors) {
                $('<li>').text(e.message).appendTo(list);
            }
        }

        if (shipment.hasOwnProperty('message')) {
            p.text(shipment.message);
        }
        row[0].scrollIntoView();
    }

    shipmentPriceChanged(shipment){
        const row = this.getShipmentRow(shipment.id);
        if (row === null) {
            return null;
        }
        row.find('.net').show().text(Number(shipment.net).toFixed(2).replace('.',',')+' zł');
        row.find('.gross').show().text(Number(shipment.gross).toFixed(2).replace('.',',')+' zł');
    }

    shipmentRegistered(shipment){
        const row = this.getShipmentRow(shipment.id);
        if (row === null) {
            return null;
        }
        row.fadeOut({
            complete: function(e){
                $(this).remove();
            }
        });
    }
    process(method, ids){
        $('p.shipment-error').empty().hide();
        const shipments = [];
        for (const id of ids) {
            shipments.push({id:id});
        }
        $.ajax({
            url: '/shipments/register',
            method: 'post',
            headers: {
                accept: 'application/json',
                ws: app && app.socket && app.socket.id ? JSON.stringify({
                    port: app.socket.io.opts.port,
                    id: app.socket.id
                }) : null,
            },
            context: this,
            contentType: 'application/json',
            data: JSON.stringify({
                shipments: shipments,
                paymentMethod: {
                    code: method
                }
            }),
            error: function(xhr){
                const msg = xhr?.responseJSON?.errors[0]?.message ?? "Wystąpił błąd podczas procesowania zapytania";
                const modal = this.getModal();
                modal.find('.modal-footer').empty().hide();
                modal.find('.modal-title').text("Błąd");
                modal.find('.modal-body').text(msg);
            },
            success: function(data,status,xhr){
                const url = data.transaction?.url;
                this.getModal().modal('hide');
                if (typeof url === 'string'){
                    window.top.location.href = url;
                }

                const ids = Object.keys(data.errors ?? '');
                for (const id of ids) {
                    const error = data.errors[id];
                    error.id = id;
                    this.shipmentError(error);
                }
            },
            complete:function(){
                this.getModal().data('ids', []);
            },
        });
    }

    registerShipments(){
        const ids = this.getIds();
        if(ids.length === 0)
        {
            alert("Zaznacz przynajmniej jedną przesyłkę");
            return false;
        }

        const modal = this.getModal().modal('show');
        modal.find('.modal-footer').empty().hide();
        modal.find('.modal-body').empty().hide();
        modal.find('.modal-title').text("Trwa ładowanie");
        $.ajax({
            url: '/payment-methods',
            method: 'GET',
            success: function(ids, res){
                const modal = this.getModal();
                if (res.methods instanceof Array && res.methods.length > 0) {
                    if (res.methods.length === 1) {
                        this.process(res.methods[0].code, ids);
                    } else {
                        modal.find('.modal-title').text("Wybierz metodę płatności");
                        modal.data('ids', ids);
                        modal.find('.modal-footer').show().append(
                            $('<button type="button" class="btn btn-primary" name="confirm">Zatwierdź</button>').click(function(){
                                const method = modal.find('[name=paymentMethod]:checked')[0]?.value ?? null;
                                if (method === null) {
                                    return alert("Wybierz metodę płatości");
                                }
                                const ids = modal.data('ids');
                                this.process(method,ids);
                            }.bind(this))
                        )
                        const target = modal.find('.modal-body').show().empty();
                        $('<p>').text('Wybierz metodę płatności celem nadania przesyłek').appendTo(target);
                        for (const method of res.methods) {
                            $('<label>').text(' '+method.name).prepend(
                                $('<input>').attr({
                                    type: 'radio',
                                    value: method.code,
                                    name: 'paymentMethod'
                                })
                            ).appendTo(target);
                        }
                    }
                } else {
                    alert("Brak dostępnych metod płatności");
                }
            }.bind(this, ids),
        });
    }

    downloadProtocols() {
        const ids = this.getIds();
        if(ids.length === 0)
        {
            alert("Zaznacz przynajmniej jedną przesyłkę");
            return false;
        }

    }

    consolidationValueChanged(form) {
        const dispatch = 'carrier';
        const ownInput = form.find('[name=own]');
        const carrierInput = form.find('[name=carrier]');
        const numberInput = form.find('[name=number]');
        const buttonRow = form.find('button').parents('tr').eq(0).hide();
        const numberRow = numberInput.parents('tr').eq(0).hide();
        const ownRow = ownInput.parents('tr').eq(0).hide();
        const carrierRow = carrierInput.parents('tr').eq(0).hide();
        const own = ownInput.val()==='1';
        const methods = own ? {
            dhl: 'DHL',
            inpost: 'InPost',
            dpd: 'DPD',
            ups: 'UPS',
            fedex: 'FedEx'
        } : null;

        if (dispatch === 'carrier') {
            ownRow.show();
            if (own) {
                numberRow.show();
                carrierInput.show();
            } else {
                buttonRow.show();
                carrierInput.hide();
                return;
            }
            const options = [];
            for (const key of Object.keys(methods)) {
                let option = carrierInput.find('option[value="'+key+'"]');
                if (option.length === 0) {
                    option = $('<option>').text(methods[key]).attr({value:key}).appendTo(carrierInput);
                }
                options.push(option[0]);
            }
            carrierInput.children().not(options).remove();

            carrierRow.show();
            if (!own || numberInput.val().length>0) {
                buttonRow.show();
            }
        } else if(dispatch === 'other') {
            buttonRow.show();
        }
    }

    consolidationError(xhr) {
        let msg = xhr.responseJSON?.errors[0]?.message;
        if (typeof msg !== 'string') {
            msg = 'Wystąpił błąd podczas tworzenia konsolidacji';
        }
        alert(msg);
    }
    consolidationCreated(modal, res) {
        try {
            const id = res.consolidation.id;
            if (id > 0) {
                window.top.location.href = '/przesylki/konsolidacje/'+id;
                return;
            }
        } catch (e) {}
        alert("Nie udało się odczytać ID utworzonej konsolidacji");
    }
    confirmConsolidation(form, modal, e) {
        e.preventDefault();
        const ids = this.getIds();
        for (const pos in ids) {
            ids[pos] = {
                id: ids[pos]
            };
        }
        const inputs = form.find(':input');
        $.ajax({
            url: '/api/shipments-consolidations',
            method: 'post',
            headers: {
                'content-type':'application/json',
                accept: 'application/json',
            },
            data: JSON.stringify({
                shipments: ids,
                method: inputs.filter('[name=dispatch]').val() ?? 'carrier',
                own: inputs.filter('[name=own]').val() === '1',
                carrier: inputs.filter('[name=carrier]').val(),
                number: inputs.filter('[name=number]').val(),
            }),
            success: this.consolidationCreated.bind(this,modal),
            error: this.consolidationError.bind(this)
        });
        return false;
    }
    registerConsolidation(){
        const ids = this.getIds();
        if(ids.length === 0)
        {
            alert("Zaznacz przynajmniej jedną przesyłkę by utworzyć konsolidację");
            return false;
        }
        const modal = $(document.getElementById('consolidation-modal').innerHTML);
        modal.appendTo('body');
        modal.modal('show');
        modal.find('.modal-footer').remove();
        const form = modal.find('form[name=consolidation]');
        $(form).find('td').css('padding','1px');
        form.submit(this.confirmConsolidation.bind(this, form, modal));
        this.consolidationValueChanged(form);
        modal.find(':input').change(this.consolidationValueChanged.bind(this, form));
    }
    downloadLabels(type){
        const ids = this.getIds();
        if(ids.length === 0)
        {
            alert("Zaznacz przynajmniej jedną przesyłkę");
            return false;
        }

        const modal = this.getModal().modal('show');
        modal.find('.modal-footer').empty().hide();
        modal.find('.modal-title').text("Trwa generowanie pliku");
        modal.find('.modal-body').empty();


        const data = {};
        let url = '/waybills/files';
        if (type === 'label') {
            const waybills = [];
            for (const id of ids) {
                waybills.push({shipment: {id: id}});
            }
            data.waybills = waybills;
        } else {
            url = '/shipments/manifests';
            const shipments = [];
            for (const id of ids) {
                shipments.push({id: id});
            }
            data.shipments = shipments;
        }
        $.ajax({
            url: url,
            method: 'post',
            contentType:'application/json',
            headers: {
                accept: 'application/json',
            },
            data: JSON.stringify(data),
            success:function(res){
                const url = res?.file?.url;
                this.modal('hide');
                if (typeof url === 'string') {
                    this.find('.modal-body').append(
                        $('<a>').text("Pobierz").attr({
                            href: url
                        })
                    );
                    window.open(url);
                } else {
                    alert("Brak pliku do pobrania");
                }
            }.bind(modal),
            error: function(xhr){
                this.find('.modal-title').text("Nie udało się pobrać plików");
                const errors = xhr?.responseJSON?.errors;
                const target = this.find('.modal-body').empty();
                if (errors instanceof Array && errors.length>0) {
                    for (const error of errors) {
                        $('<p>').css({color: 'red'}).text(error.message).appendTo(target);
                    }
                }
            }.bind(modal)
        });
        return false;
    }
}

const shipmentsList = new Shipments();
$(document).ready(function () {
    shipmentsList.init();
});