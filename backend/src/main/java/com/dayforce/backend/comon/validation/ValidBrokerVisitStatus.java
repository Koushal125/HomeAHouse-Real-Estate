package com.dayforce.backend.comon.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Restricts {@code VisitStatusUpdateRequest.status} to the three statuses a broker
 * may explicitly set: CONFIRMED, COMPLETED, CANCELLED.
 * REQUESTED is excluded because visits always begin in that state automatically.
 */
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidBrokerVisitStatusValidator.class)
@Documented
public @interface ValidBrokerVisitStatus {

    String message() default "Status must be one of: CONFIRMED, COMPLETED, CANCELLED.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
