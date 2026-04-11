package com.tactilegallery.backend.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tactilegallery.backend.config.AppFrontendProperties;
import com.tactilegallery.backend.config.AppMailProperties;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.Executor;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class EmailNotificationServiceTest {

    private final JavaMailSender mailSender = mock(JavaMailSender.class);
    private final CapturingExecutor executor = new CapturingExecutor();
    private final EmailNotificationService service = new EmailNotificationService(
        mailSender,
        mailProperties(),
        frontendProperties(),
        new EmailTemplateRenderer(frontendProperties()),
        executor
    );

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void sendsRegistrationEmailOnDedicatedExecutor() {
        AppUserEntity user = user();
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        service.sendRegistrationConfirmation(user);

        verify(mailSender, never()).send(any(MimeMessage.class));
        executor.runAll();

        verify(mailSender).send(message);
    }

    @Test
    void waitsForTransactionCommitBeforeSchedulingEmail() {
        AppUserEntity user = user();
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);

        service.sendRegistrationConfirmation(user);

        verify(mailSender, never()).send(any(MimeMessage.class));
        executor.runAll();
        verify(mailSender, never()).send(any(MimeMessage.class));

        for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
        }

        verify(mailSender, never()).send(any(MimeMessage.class));
        executor.runAll();

        verify(mailSender).send(message);
    }

    private AppUserEntity user() {
        AppUserEntity user = new AppUserEntity();
        user.setName("Atelier Member");
        user.setEmail("member@example.com");
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    private AppMailProperties mailProperties() {
        AppMailProperties properties = new AppMailProperties();
        properties.setEnabled(true);
        properties.setFrom("no-reply@tactile.gallery");
        properties.setFromName("Tactile Gallery");
        return properties;
    }

    private AppFrontendProperties frontendProperties() {
        AppFrontendProperties properties = new AppFrontendProperties();
        properties.setBaseUrl("https://tactile.gallery");
        return properties;
    }

    private static final class CapturingExecutor implements Executor {

        private final List<Runnable> tasks = new ArrayList<>();

        @Override
        public void execute(Runnable command) {
            tasks.add(command);
        }

        void runAll() {
            List<Runnable> pending = new ArrayList<>(tasks);
            tasks.clear();
            pending.forEach(Runnable::run);
        }
    }
}
