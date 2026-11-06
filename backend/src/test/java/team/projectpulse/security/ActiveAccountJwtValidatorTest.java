package team.projectpulse.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import team.projectpulse.student.Student;
import team.projectpulse.user.UserRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class ActiveAccountJwtValidatorTest {

    @Mock
    UserRepository userRepository;

    @Test
    void acceptsTokenForAnEnabledAccount() {
        Student student = new Student();
        student.setEnabled(true);
        given(this.userRepository.findById(42)).willReturn(Optional.of(student));

        var result = new ActiveAccountJwtValidator(this.userRepository).validate(jwtWithUserId(42));

        assertThat(result.hasErrors()).isFalse();
    }

    @Test
    void rejectsTokenForADeactivatedAccount() {
        Student student = new Student();
        student.setEnabled(false);
        given(this.userRepository.findById(42)).willReturn(Optional.of(student));

        var result = new ActiveAccountJwtValidator(this.userRepository).validate(jwtWithUserId(42));

        assertThat(result.hasErrors()).isTrue();
    }

    @Test
    void rejectsTokenWhoseAccountNoLongerExists() {
        given(this.userRepository.findById(42)).willReturn(Optional.empty());

        var result = new ActiveAccountJwtValidator(this.userRepository).validate(jwtWithUserId(42));

        assertThat(result.hasErrors()).isTrue();
    }

    @Test
    void rejectsTokenWithoutAnAccountIdWithoutQueryingTheRepository() {
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "none").claim("sub", "user").build();

        var result = new ActiveAccountJwtValidator(this.userRepository).validate(jwt);

        assertThat(result.hasErrors()).isTrue();
        verifyNoInteractions(this.userRepository);
    }

    private static Jwt jwtWithUserId(Integer userId) {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("userId", userId)
                .build();
    }

}
