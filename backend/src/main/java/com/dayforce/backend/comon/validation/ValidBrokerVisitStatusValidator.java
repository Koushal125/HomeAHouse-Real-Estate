package com.dayforce.backend.comon.validation;

import com.dayforce.backend.domain.entity.enums.VisitStatus;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.EnumSet;
import java.util.Set;

public class ValidBrokerVisitStatusValidator implements ConstraintValidator<ValidBrokerVisitStatus, VisitStatus> {

    private static final Set<VisitStatus> ALLOWED = EnumSet.of(
            VisitStatus.CONFIRMED,
            VisitStatus.COMPLETED,
            VisitStatus.CANCELLED
    );

    @Override
    public boolean isValid(VisitStatus value, ConstraintValidatorContext context) {
        // null is handled by @NotNull — allow it through here to avoid duplicate messages
        return value == null || ALLOWED.contains(value);
    }
}
