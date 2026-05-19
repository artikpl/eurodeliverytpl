class OrdersForm{
    init(options){
        this.table = $('div.table-details-wrapper').hide();
        this.form = $('form[name=filter]');
        this.sourceInput = this.form.find('[name=source]');
        this.statusInput = this.form.find('[name=status]');
        this.sourceInput.change(this.sourceChanged.bind(this));
        this.form.find(':input').not(this.sourceInput).change(this.filter.bind(this));
        if (options.integrations instanceof Array && options.integrations.length > 0) {
            this.setIntegrations(options.integrations);
        }

        $('[name=add-integrations]').click(this.showIntegrationsTypeModal.bind(this));
    }
    setStatus(status) {
        return $('<h4 class="status">').text(status).insertAfter(this.table);
    }
    filter() {
        const source = this.sourceInput.val();
        const status = this.statusInput.val();
        if (source>0 && status.length > 0) {
            const params = new URLSearchParams({
                status: status,
            });
            $('h4.status').remove();
            $.ajax({
                method: 'GET',
                url: '/api/integrations/'+source+'/orders?'+params.toString(),
                success: this.ordersLoaded.bind(this),
                complete: function(){
                    this.remove();
                }.bind(this.setStatus("Trwa ładowanie zamówień"))
            });
        }
    }

    ordersLoaded(res) {
        if (res.orders instanceof Array && res.orders.length > 0) {
            this.setOrders(res.orders);
        } else {
            this.table.hide();
            this.setStatus("Brak zamówień");
        }
    }

    createRecipient(recipient) {
        if (recipient === null) {
            return null;
        }
        const lines = [];
        const name = [];
        if (recipient.hasOwnProperty('company') && recipient.company.length > 0) {
            name.push(recipient.company);
        }
        if (recipient.hasOwnProperty('firstname') && recipient.firstname.length > 0) {
            name.push(recipient.firstname);
        }
        if (recipient.hasOwnProperty('lastname') && recipient.lastname.length > 0) {
            name.push(recipient.lastname);
        }
        if (name.length > 0) {
            lines.push($('<p>').text(name.join(' ')));
        }
        const address = [];
        if (recipient.hasOwnProperty('street') && recipient.street.length > 0) {
            address.push(recipient.street);
            if (recipient.hasOwnProperty('building') && recipient.building.length > 0) {
                address[0] = address[0]+' '+recipient.building;
                if (recipient.hasOwnProperty('apartment') && recipient.apartment.length > 0) {
                    address[0] = address[0]+' '+recipient.apartment;
                }
            }
        }
        if (recipient.hasOwnProperty('postcode') && recipient.postcode.length > 0) {
            address.push(recipient.postcode);
        }
        if (recipient.hasOwnProperty('city') && recipient.city.length > 0) {
            address.push(recipient.city);
        }
        address.push(recipient.country.iso);
        lines.push($('<p>').text(address.join(', ')));
        return lines;
    }
    setOrders(orders) {
        this.table.show();
        const tbody = this.table.find('tbody').empty();
        for (const order of orders) {
            const recipient = order?.addresses?.recipient ?? null;
            $('<tr>').appendTo(tbody).append(
                $('<td>').text(order.extId),
                $('<td>').append(
                    order.hasOwnProperty('paymentMethod') ? $('<p>').text(order.paymentMethod.name) : null,
                    order.hasOwnProperty('deliveryMethod') ? $('<p>').text(order.deliveryMethod.name) : null
                ),
                $('<td>').append(this.createRecipient(recipient)),
                $('<td>').append(
                    $('<a>').attr({
                        href: '/zamowienia/'+order.id+'/wyslij?extId='+order.extId
                    }).text('Wyslij'),
                )
            );
        }
    }

    sourceChanged(){
        const source = this.sourceInput.val();
        this.statusInput.empty().parents('label').eq(0).hide();
        this.sourceInput.parent('label').siblings('label').hide();
        if (source > 0) {
            $.ajax({
                method: 'GET',
                url: '/api/integrations/'+source+'/orders-statuses',
                success: this.statusesLoaded.bind(this),
            });
        }
    }

    statusesLoaded(res){
        this.statusInput.parents('label').eq(0).show();
        this.statusInput.append($('<option>'));
        for (const status of res.statuses) {
            $('<option>').text(status.name).val(status.extId).appendTo(this.statusInput);
        }
    }
    showIntegrationsTypeModal(){
        const modal = new Modal({
            title: 'Wybierz typ integracji',
        }).setContent($('template')[0].innerHTML);

        $.ajax({
            method: 'GET',
            url: '/api/integration-types',
            success: this.integrationsTypesLoaded.bind(this, modal),
        });
    }

    integrationsTypesLoaded(modal, res){
        const node = $('<div>');
        for (const type of res.types) {
            $('<p class="mb-1 text-center">').appendTo(node).append(
                $('<button type="button" class="w-50">').text(type.name).click(this.openCredential.bind(this, modal, type))
            );
        }
        modal.find('.internal-integrations').append(node);
        modal.find('.external-integrations button[data-type]').click(this.openExternalIntegration.bind(this, modal));
    }

    openExternalIntegration(modal, e) {
        modal.close(true);
        const label = $(e.target).text();
        const type = $(e.target).data('type');
        modal = new Modal({
            title: "Dodawanie integracji zewnętrznej z "+label
        });
        $.ajax({
            url: '/external-integrations/'+type+'/manual',
            method: 'GET',
            success: this.externalIntegrationLoaded.bind(this, type, modal),
        });
    }

    createCredentials(type, modal) {
        $.ajax({
            url: '/external-integration-credential',
            data: JSON.stringify({
                type: {
                    code: type
                }
            }),
            headers: {
                accept: 'application/json',
                'content-type': 'application/json'
            },
            method: 'POST',
            success: this.updateExternalIntegrationCredentials.bind(this, modal),
        });
    }

    toClipBoard(value) {
        navigator.clipboard.writeText(value).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            alert('Nie udało się skopiować wartości do schowka');
        });
    }
    updateExternalIntegrationCredentials(modal,res) {
        for(const key in res.values) {
            const node = modal.find('[data-name="'+key+'"]').parent();
            node.text(res.values[key]+' ');
            node.append(
                $('<button class="btn p-1 btn-xs btn-secondary">').text("Kopiuj").click(this.toClipBoard.bind(this,res.values[key]+''))
            )
        }
    }
    externalIntegrationLoaded(type, modal, res) {
        modal.setContent(res.source);
        modal.find('[data-name]').click(this.createCredentials.bind(this, type, modal));
    }
    openCredential(modal, type) {
        modal.close(true);
        const modal2 = new Modal({
            title: 'Dodawanie integracji '+type.name,
        });
        $.ajax({
            method: 'POST',
            url: '/api/precredentials',
            data: JSON.stringify({
                type: type
            }),
            success: this.showPrecredential.bind(this, modal2)
        });
    }

    createInput(field) {
        if (field.type === 'string') {
            const input = $('<input>').attr({
                type: 'text',
                name: field.code,
            });
            if (field.encrypted) {
                input.attr('type', 'password');
            }
            return input;
        } else {
            console.log(field,'xxx');
        }
    }
    showPrecredential(modal, data) {
        const node = $('<div>');
        const redirect = data.precredential?.redirectTo;
        if (typeof redirect === 'string') {
            window.top.location.href = redirect;
        }

        for (const field of Object.values(data.precredential.fields)) {
            const input = this.createInput(field);
            data.precredential.fields[field.code].input = input
            $('<label>').appendTo(node).append(
                $('<span>').text(field.name),
                input
            );
        }
        modal.setContent(node);
        const btn = $('<button type="button">').text('Zapisz').click(this.save.bind(this, modal, data.precredential));
        modal.setFooter($('<div>').append(btn));
    }

    save(modal, precredential) {
        const values = {};
        for (const field of Object.values(precredential.fields)) {
            values[field.code] = field.input.val().trim();
        }
        $.ajax({
            method: 'POST',
            url: '/api/credentials',
            headers: {
                'content-type' : 'application/json',
                'accept' : 'application/json',
            },
            data: JSON.stringify({
                name: Math.random().toString(16),
                precredential: {
                    uuid: precredential.uuid
                },
                values: values
            }),
            error: this.unsaved.bind(this, modal),
            success: this.saved.bind(this, modal),
        });
        console.log('x', this,modal,precredential);
    }

    saved(modal, res) {
        if (res.hasOwnProperty('integrations') && res.integrations) {
            modal.close();
            this.setIntegrations(res.integrations);
        }
    }

    setIntegrations(integrations) {
        this.form.parent().show();
        const input = this.form.find('[name=source]');
        const val = input.val();
        input.empty().append($('<option>'));
        for (const integration of integrations) {
            $('<option>').text(integration.type.name+', '+integration.name).val(integration.id).appendTo(input);
        }
        input.val(val);

        console.log('xxx aa', this, integrations);
    }
    unsaved(modal, xhr) {
        let error = 'Błąd podczas zapisu autoryzacji';
        try {
            const node = xhr.responseJSON.errors[0];
            if (typeof node.message === 'string') {
                error = node.message;
            } else if(typeof node.error_description === 'string') {
                error = node.error_description;
            }
        } catch (e) {}
        alert(error);
    }
}

const ordersFormObj = new OrdersForm();
$(document).ready(function(){
    ordersFormObj.init({
        integrations: integrations
    });
});