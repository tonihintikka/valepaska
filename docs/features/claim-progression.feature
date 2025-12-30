Feature: Claim Progression
  As a player
  I need to make claims that follow the rank progression rules
  So that the game maintains proper flow

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @progression @starting
  Scenario: First claim must be number card when deck has cards
    Given the table pile is empty
    And there is no last claim
    And the draw pile has cards
    When player 1 plays cards claiming rank "7"
    Then the move should be accepted

  @progression @starting @validation
  Scenario: First claim cannot be face card when deck has cards
    Given the table pile is empty
    And there is no last claim
    And the draw pile has cards
    When player 1 tries to play cards claiming rank "K"
    Then the move should be rejected with error "Starting claim must be a number card"

  @progression @starting
  Scenario: First claim can be any rank when deck is empty
    Given the table pile is empty
    And there is no last claim
    And the draw pile is empty
    When player 1 plays cards claiming rank "K"
    Then the move should be accepted

  @progression
  Scenario: Claim with same rank is valid
    Given the last claim was rank "7"
    When player 2 plays cards claiming rank "7"
    Then the move should be accepted

  @progression
  Scenario: Claim with higher rank is valid
    Given the last claim was rank "7"
    When player 2 plays cards claiming rank "9"
    Then the move should be accepted

  @progression @validation
  Scenario: Claim with lower rank is invalid
    Given the last claim was rank "7"
    When player 2 tries to play cards claiming rank "5"
    Then the move should be rejected with error "Claim rank must be same or higher than last claim"

  @progression
  Scenario Outline: Valid claim progressions
    Given the last claim was rank "<last_rank>"
    When player 2 plays cards claiming rank "<new_rank>"
    Then the move should be <result>

    Examples:
      | last_rank | new_rank | result   | comment                              |
      | 3         | 3        | accepted | same rank                            |
      | 3         | 4        | accepted | higher rank                          |
      | 3         | 10       | accepted | 10 burns number cards                |
      | 3         | A        | rejected | A only burns face cards (J,Q,K)      |
      | 3         | 2        | accepted | 2 is wildcard                        |
      | 3         | J        | rejected | face cards need lastClaim >= 7       |
      | 3         | Q        | rejected | face cards need lastClaim >= 7       |
      | 3         | K        | rejected | face cards need lastClaim >= 7       |
      | 7         | 7        | accepted | same rank                            |
      | 7         | J        | accepted | face cards allowed after 7           |
      | 7         | Q        | accepted | face cards allowed after 7           |
      | 7         | K        | accepted | face cards allowed after 7           |
      | 7         | 10       | accepted | 10 burns number cards (7 is number)  |
      | 7         | A        | rejected | A only burns face cards              |
      | 7         | 6        | rejected | lower rank                           |
      | 7         | 3        | rejected | lower rank                           |
      | J         | A        | accepted | A burns face cards                   |
      | J         | 10       | rejected | 10 cannot be played on face cards    |
      | K         | K        | accepted | same rank                            |
      | K         | A        | accepted | A burns face cards                   |
      | K         | 2        | accepted | 2 is wildcard                        |
      | K         | Q        | rejected | lower rank                           |
      | A         | A        | accepted | same rank                            |
      | A         | 2        | accepted | 2 is wildcard                        |
      | A         | K        | rejected | lower rank                           |

  @progression @special-rule
  Scenario: 2 can be claimed anytime (wildcard)
    Given the last claim was rank "5"
    When player 2 plays cards claiming rank "2"
    Then the move should be accepted

  @progression @special-rule
  Scenario: After 2, only 2 is valid
    Given the last claim was rank "2"
    When player 2 plays cards claiming rank "2"
    Then the move should be accepted

  @progression @special-rule @validation
  Scenario: After 2, claiming 10 is invalid
    Given the last claim was rank "2"
    When player 2 tries to play cards claiming rank "10"
    Then the move should be rejected with error "After 2, only 2 is a valid claim"

  @progression @special-rule @validation
  Scenario: After 2, claiming A is invalid
    Given the last claim was rank "2"
    When player 2 tries to play cards claiming rank "A"
    Then the move should be rejected with error "After 2, only 2 is a valid claim"

  @progression @special-rule @validation
  Scenario Outline: After 2, other ranks are invalid
    Given the last claim was rank "2"
    When player 2 tries to play cards claiming rank "<rank>"
    Then the move should be rejected with error "After 2, only 2 is a valid claim"

    Examples:
      | rank |
      | 3    |
      | 4    |
      | 5    |
      | 6    |
      | 7    |
      | 8    |
      | 9    |
      | J    |
      | Q    |
      | K    |

  @progression @face-cards
  Scenario: Face cards (J, Q, K) not allowed before reaching 7
    Given the last claim was rank "5"
    When player 2 tries to play cards claiming rank "J"
    Then the move should be rejected with error "Face cards (J, Q, K) can only be claimed after reaching 7"

  @progression @face-cards
  Scenario: Face cards (J, Q, K) allowed after reaching 7
    Given the last claim was rank "7"
    When player 2 plays cards claiming rank "J"
    Then the move should be accepted

  @progression @burn-cards
  Scenario: 10 burns number cards (3-9)
    Given the last claim was rank "5"
    When player 2 plays cards claiming rank "10"
    Then the move should be accepted
    And the table should burn

  @progression @burn-cards
  Scenario: A burns face cards (J, Q, K)
    Given the last claim was rank "J"
    When player 2 plays cards claiming rank "A"
    Then the move should be accepted
    And the table should burn

  @progression @burn-cards @validation
  Scenario: A cannot be played on number cards
    Given the last claim was rank "7"
    When player 2 tries to play cards claiming rank "A"
    Then the move should be rejected with error "A can only be claimed on face cards (J, Q, K)"

  @progression @burn-cards @validation
  Scenario: 10 cannot be played on face cards
    Given the last claim was rank "J"
    When player 2 tries to play cards claiming rank "10"
    Then the move should be rejected with error "10 can only be claimed on number cards (3-9)"

  @progression @rank-order
  Scenario: Rank order is correct
    Then the rank order should be "3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2"

