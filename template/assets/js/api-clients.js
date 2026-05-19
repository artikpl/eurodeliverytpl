class ApiClientsForm{
    constructor(options) {
        this.options = options;
        this.tbody = $('table.api-clients tbody');
        if (options && options.clients instanceof Array && options.clients.length > 0) {
            for (const client of options.clients) {
                this.appendClient(client);
                $('<tr>').appendTo()
            }
        }

        $('[name=add-client]').show().click(this.createNew.bind(this));
    }

    appendClient(client) {
        this.tbody.append(this.createClient(client));
    }

    prependClient(client) {
        this.tbody.prepend(this.createClient(client));
    }

    createClient(client) {
        client.row = $('<tr>');
        return client.row.append(
            $('<td>').text(client.clientId),
            $('<td>').text(client.name),
            $('<td>').append(
                $('<button type="button" class="btn btn-danger btn-xs">').text("Usuń").click(this.removeClient.bind(this,client)),
                $('<button type="button" class="btn btn-info btn-xs">').text("Nowy Client Secret").click(this.rotateSecret.bind(this,client)),
            )
        );
    }

    rotateSecret(client) {
        if (confirm("Czy chcesz utworzyć nowy client secret dla klienta "+client.name)) {
            $.ajax({
                method: 'post',
                url: '/api/clients/'+client.clientId+'/rotate-secret',
                success: function(c,res){
                    const modal = new Modal({
                        title: 'Dane konta',
                        content: $('<div>').append($('template')[0].innerHTML)
                    });
                    this.showClientDetails(modal, res.client);
                }.bind(this,client)
            });
        }
    }
    removeClient(client){
        if (confirm('Czy chcesz usunąć klienta '+client.name)) {
            $.ajax({
                method: 'delete',
                url: '/api/clients/'+client.clientId,
                success: function(){
                    this.fadeOut({
                        complete: function(e){
                            $(this).remove();
                        }
                    });
                }.bind(client.row)
            });
        }
        console.log("usuń",this,client);
    }

    saved(modal,res) {
        this.prependClient(res.client);
        this.showClientDetails(modal, res.client);
    }

    showClientDetails(modal, client) {
        const table = modal.find('.saved').show();
        table.siblings().hide();
        table.find('[name=client_id]').val(client.clientId);
        table.find('[name=client_secret]').val(client.clientSecret);
    }
    unsaved(a,b,c){
        console.log('xx',this, a,b,c);
    }
    save(modal){
        const name = modal.find('input[name=name]').val().trim();
        $.ajax({
            url: '/api/clients',
            method: 'post',
            headers: {
                accept: 'application/json',
                'content-type':'application/json',
            },
            data: JSON.stringify({
                name: name
            }),
            context: this,
            success: this.saved.bind(this,modal),
            error:this.unsaved
        });
        return false;
    }
    createNew(){
        const modal = new Modal({
            title: 'Dodawanie nowego klienta API',
            content: $('<div>').append($('template')[0].innerHTML)
        });
        modal.find('[name=new-client]').submit(this.save.bind(this,modal));
    }
}

let apiClientsFormObj = null;
$(document).ready(function(){
    apiClientsFormObj = new ApiClientsForm({
        clients: clients
    });
});