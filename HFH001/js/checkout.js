const checkout = function(amount, orderUrl) {
    let config = {
        environmentId: 'p-kyJvqqWdd0aud06jdym-3Q',
        paymentConfigurationId: '280dd61c-f17c-4ea1-8a1d-f62e0105e773',
        applicationName: 'Luminate',
        workflowMode: 'inline',
        paymentMethodOptions: {
            directDebit: {
                enabled: false
            },
            card: {
                enabled: true
            },
            payPal: {
                enabled: false
            },
            wallets: {
                applePayEnabled: false,
                googlePayEnabled: false
            }
        }
    };

    let checkoutService = window.BlackbaudCheckout(config);

    checkoutService.transactionCategory = "donation";
    checkoutService.isRecurring = true;
    checkoutService.recurrenceDescription = "monthly";
    checkoutService.baseAmount = amount * 100;

    //subscribe to events
    checkoutService.inlineCheckoutComponent.valid.subscribe((e) => {
        console.log('Checkout valid');
    });

    checkoutService.inlineCheckoutComponent.loading.subscribe((e) => {
        console.log('Checkout loading');
    });

    let checkoutServiceReady = false;
    checkoutService.inlineCheckoutComponent.ready.subscribe((e) => {
        checkoutServiceReady = true;
        console.log('Checkout ready');
    });
    checkoutService.completeCheckoutButtonComponent.authorizationInProgress.subscribe((e) => {
        console.log('Checkout Authorization is in progress');
    });
    checkoutService.completeCheckoutButtonComponent.clicked.subscribe((e) => {
        console.log('The complete checkout button was clicked.');       
    });
    checkoutService.checkoutComplete.subscribe((e) => {
        console.log('Checkout complete.');
        submitCheckout(orderUrl, e);
    });

    //mount the components
    checkoutService.inlineCheckoutComponent.mount('inline-checkout');
    checkoutService.completeCheckoutButtonComponent.mount('complete-checkout-button', 'checkout-button');

    checkoutService.completeCheckoutButtonComponent.enabled = true;
}

let submitCheckoutDone = false;
const submitCheckout = function(orderUrl, checkoutData) {
		if (submitCheckoutDone) {
        return;
    }
    submitCheckoutDone = true;
    console.log("submitCheckout called");
    var checkoutUri = orderUrl + 'api/luminate.php?action=checkout';
    $("#checkout-button").hide();
    $("[data-role=procSplash]").show();

    $.post(checkoutUri, JSON.stringify(checkoutData), function(checkoutResponse) {
        if (checkoutResponse.redirectTo == 2) {
            $("[data-role=procSplash]").hide();
            $("#declinedExplanation").html(checkoutResponse.declinedExplanation);
            $("#checkout-button").show();
            submitCheckoutDone = false;
            return;
        }
        if (checkoutResponse.redirectTo == 1) {
            validate(orderUrl);
        }
        if (checkoutResponse.redirectTo == 0) {
            window.location.href = orderUrl + "confirmation_dummy.php";
        }
    }).fail(function() {
        window.location.href = orderUrl + "confirmation_dummy.php";
    });
}

const validate = function(orderUrl) {
    let validateUri = orderUrl + 'api/luminate.php?action=validate';
    $.post(validateUri, function(validateResponse) {
        if (validateResponse.redirectTo == 0) {
            window.location.href = orderUrl + "confirmation_dummy.php";            
        }
        if (validateResponse.redirectTo == 1) {
            window.location.href = orderUrl + "confirmation_pp_declines.php";
        }
        if (validateResponse.redirectTo == 2) {
            submitLuminate(orderUrl);
        }
    }).fail(function() {
        window.location.href = orderUrl + "confirmation_dummy.php";
    });
}

const submitLuminate = function(orderUrl) {
    var luminatelUri = orderUrl + 'api/luminate.php';

    $.get(luminatelUri, function(apiData) {
        console.log("submitLuminate GET response received");
        $.post(apiData.url, apiData.data, jQuery.noop, "json").always(function(luminateData, status, xhr) {
            var postData = {
                data: (xhr && xhr.status == 200) ? luminateData : (xhr && xhr.responseText ? JSON.parse(xhr.responseText) : { error: "CORS error or network issue" }),
                ok: xhr && xhr.status == 200,
                httpCode: xhr ? xhr.status : 0
            };

            $.post(luminatelUri, JSON.stringify(postData), function(processResponse) {
                if (processResponse.redirectTo == "order2.php") {
                    $("[data-role=procSplash]").hide();
                    $("#declinedExplanation").html(processResponse.declinedExplanation);
                    $("#checkout-button").show();
                } else {
                    window.location.href = orderUrl + processResponse.redirectTo;
                }

            }).fail(function() {
                window.location.href = orderUrl + "confirmation_dummy.php";
            });

        });

    }).fail(function() {
        window.location.href = orderUrl + "confirmation_dummy.php";
    });
}

const submitOrd = function() {
    showConfirmOnsubmit = false;
    var objSubmit = document.getElementById('submitOrder');
    objSubmit.value = 1;
    document.forms[0].submit();
}