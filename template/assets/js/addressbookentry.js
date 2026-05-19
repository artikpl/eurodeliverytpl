class AddressBook{
    constructor(options){
        this.form = options.form;
        this.form.submit(this.save.bind(this));
        this.form.show();
    }

    save(e){
        e.preventDefault();
        const data = this.serialize();
        data.country = {iso: data.country};
        let url = '/api/contacts'
        let method = 'POST';
        if (data.hasOwnProperty('id')) {
            url = url+'/'+data.id;
            method = 'PATCH';
            delete data.id;
        }
        $('div.content h1').eq(0).siblings('.alert').remove();

        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify({contact:data}),
            contentType: 'application/json',
            headers: {
                accept: 'application/json'
            },
            success: this.saved.bind(this),
            error: this.unsaved.bind(this),
        });
    }

    saved(res) {
        const id = res?.contact?.id;
        if (id > 0) {
            const input = this.form.find('input[name=id]');
            if (input.length === 0) {
                this.form.append($('<input>').attr({
                    type:'hidden',
                    name:'id',
                    value: id,
                }));
                window.history.pushState(null,null, '/kontakty/'+id);
            }
            this.showSuccess("Zapisano");
        }
    }

    unsaved(xhr) {
        let e = xhr?.responseJSON?.errors[0]?.message;
        if (typeof e !== 'string') {
            e = "Wystąpił błąd podczas zapisu";
        }
        this.showError(e);
    }

    serialize(){
        const values = {};
        for (const input of this.form.serializeArray()) {
            const value = input.value.trim();
            if (value !== '') {
                values[input.name] = value;
            }
        }
        return values;
    }

    showMessage(message, type) {
        let target = $('div.content h1').eq(0);
        target.siblings('.alert').remove();
        target = $('<div class="alert alert-'+type+' text-center">').text(message).insertAfter(target);
        target.text(message);
        target[0].scrollIntoView();
    }
    showError(message) {
        this.showMessage(message, 'danger');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }
}
$(document).ready(function(){
    new AddressBook({form: $('form.mainform')});
});