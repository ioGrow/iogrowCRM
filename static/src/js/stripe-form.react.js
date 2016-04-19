window.StripeForm = React.createClass({
    componentDidMount: function() {
          Stripe.setPublishableKey(this.props.StripeConfig.stripePublicKey);
    },

    stripeResponseHandler: function(status, response){
        var $form = $('#payment-form');
        if (response.error) {
              // Show the errors on the form
              alert(response.error.message);
              $form.find('.payment-errors').text(response.error.message);
              $form.find('button').prop('disabled', false);
        }else {
              var paymenetSuccessful = this.props.StripeConfig.paymenetSuccessful;
              paymenetSuccessful(response);
          }
    },

    handleSubmit: function (e){
        e.preventDefault();
        var $form = $('#payment-form');
        $form.find('button').prop('disabled', true);
        Stripe.card.createToken($form, this.stripeResponseHandler);
        return false;
    },

    render: function(){
        return (
                  <div className="container">
                      <h2 className="logoHeader">
                          <img src="/static/src/img/128.png" alt="" />
                      <span className="logo-copylead">Copy</span><span>lead for Salesforce</span>
                    </h2>
                    <div className="content">
                        <p>You are one step closer to unlock great sales opportunities!</p>
                         <form action="" method="POST" id="payment-form" onSubmit={this.handleSubmit}>
                           <div className="payment-infos">
                             <h3  className="title">
                                Payment informations
                             </h3>
                             <div className="row">
                                <div className="col-6">
                                    <label for="cardnumber" className="label-control">Credit Card Number</label>
                                    <input type="text" id="cardnumber" className="form-control" data-stripe="number"/>
                                    <div className="cardsimgscontainer">
                                          <img src="/static/src/img/visa.png"
                                               className="img-card" alt=""/>
                                          <img src="/static/src/img/mastercard.png" alt=""
                                              className="img-card"/>
                                          <img src="/static/src/img/american-express.png" alt=""
                                               className="img-card"/>
                                          <img src="/static/src/img/discover.png" alt=""
                                               className="img-card"/>
                                          <img src="/static/src/img/JCB.png" alt=""
                                               className="img-card"/>
                                     </div>
                                 </div>
                                 <div className="col-6">
                                     <div className="row">
                                       <div className="col-7">
                                            <label for="fullname" className="label-control">Expiration (MM/YYYY)</label>

                                       <div className="row">
                                       <div className="col-6">
                                           <input type="text" size="2" className="form-control" data-stripe="exp-month"/>
                                       </div>
                                        <div className="col-6">
                                            <input type="text" size="4" className="form-control" data-stripe="exp-year"/>
                                       </div>

                                       </div>
                                       </div>
                                       <div className="col-5">
                                          <label for="scode" className="label-control">Security code</label>
                                          <input type="text" id="scode" className="form-control" data-stripe="cvc"/>
                                          <div className="cardsimgscontainer">
                                              <img src="/static/src/img/cvc.png"
                                                   className="cvc-input" alt=""/>
                                         </div>
                                       </div>
                                     </div>
                                 </div>
                             </div>
                           </div>
                           <div className="more-infos">
                              <h3  className="title">
                                  What are you paying for is:
                             </h3>
                             <ul className="featuresList">
                               <li><span className="im-El">Unlimited leads per month</span></li>
                               <li><span className="im-El">Social networks integrations</span></li>
                               <li>Linkedin, Gmail, Twitter, facebook, AngelList</li>
                             </ul>
                           </div>
                           <div className="payment-btn-container">
                                <button type="submit" id="payment-btn">Pay 10$/month</button>
                           </div>

                         </form>
                      </div>
                      <div className="footerStripe">
                          <div className="stripe" >
                         <p className="powered-by-stripe-p"><span>Powered by </span><span className="powered-by-stripe">stripe</span></p>
                          </div>
                      </div>
                  </div>
        );
    }
});


window.ActivationNotice = React.createClass({
    render: function(){
        return (
            <div className="container">
                <div className="content">
                    <div className="row">
                        <div className="imgLeft">
                            <img alt="" src="/static/src/img/copylead_session_expired.png" />
                        </div>
                        <div className="message">
                            <h3 className="trialh3">Free Trial Expired</h3>
                            <p className="trialp">Your free trial for Copylead has been expired. Click the button bellow to activate your subscription and continue using Copylead without interruptions.</p>
                            <a href="http://app.copylead.com" target="_blank" id="payment-btn">Activate now</a>
                        </div>
                    </div>
                </div>
            </div>
             );
    }
});
