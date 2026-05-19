class TransactionsForm{
    constructor() {
        const charges = $(':input[name=charge]');
        if (charges.length > 0) {
            charges.change(this.updateCharges.bind(this));
        } else {
            $(':input').change(this.update.bind(this));
        }
    }

    showError(msg) {
        $('h1').remove();
        return $('<h1>').text(msg).insertAfter('h2');
    }

    submit(data) {
        $.ajax({
            method: 'post',
            data: JSON.stringify(data),
            contentType: 'application/json',
            headers: {
                accept: 'application/json',
            },
            url: '/transactions/submit',
            success: function (res) {
                $(':input:checked').parents('tr[data-row]').remove();
            },
            error: function(xhr){
                alert(xhr.responseText);
            }
        })
        console.log(data);
    }

    getDetails() {
        this.transactions = [];
        $('[name=transaction]:checked').each(function(index,node) {
            this.transactions.push($(node).parents('tr').eq(0).data('row'));
        }.bind(this));
        this.invoice = null;
        $('[name=invoice]:checked').each(function(index,node) {
            this.invoice = $(node).parents('tr').eq(0).data('row');
        }.bind(this));

        if (this.transactions.length === 0) {
            throw ("Zaznacz przynajmniej jedną transakcję");
        } else if (this.invoice === null) {
            throw ("Zaznacz fakturę");
        } else {
            let transactionsSum = 0;
            for (const transaction of this.transactions) {
                transactionsSum = transactionsSum + transaction.amount;
            }
            if (Math.round(transactionsSum*100) !== Math.round(this.invoice.total*100) && false) {
                throw("Różnica " + (transactionsSum - this.invoice.total));
            } else {
                return {
                    transactions: this.transactions,
                    invoice: this.invoice
                }
            }
        }
    }
    update() {
        console.log('x');
        try {
            const data = this.getDetails();
            const node = this.showError("OK");
            node.empty();
            $('<button>').text("Zatwierdź").click(this.submit.bind(this, data)).appendTo(node.empty());
        } catch (e) {
            this.showError(e);
        }
    }

    updateCharges() {

        this.charges = [];
        $('[name=charge]:checked').each(function(index,node) {
            this.charges.push($(node).parents('tr').eq(0).data('row'));
        }.bind(this));

        if (this.charges.length === 0) {
            this.showError('Wybierz przynajmniej jedno doładowanie');
            return;
        }

        const node = this.showError("OK");
        node.empty();
        $('<button>').text("Zatwierdź").click(this.submitCharges.bind(this, this.charges)).appendTo(node.empty());
    }

    submitCharges(charges) {
        console.log('x', charges);
    }
}
$(document).ready(function () {
    new TransactionsForm();
});