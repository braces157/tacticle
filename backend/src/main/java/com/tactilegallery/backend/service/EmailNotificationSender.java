package com.tactilegallery.backend.service;

import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;

public interface EmailNotificationSender {

    void sendRegistrationConfirmation(AppUserEntity user);

    void sendOrderConfirmation(DomainModels.OrderDetail order);
}
