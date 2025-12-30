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
      | last_rank | new_rank | result   |
      | 3         | 3        | accepted |
      | 3         | 4        | accepted |
      | 3         | 10       | accepted |
      | 3         | A        | accepted |
      | 3         | 2        | accepted |
      | 3         | J        | rejected |
      | 3         | Q        | rejected |
      | 3         | K        | rejected |
      | 7         | 7        | accepted |
      | 7         | J        | accepted |
      | 7         | Q        | accepted |
      | 7         | K        | accepted |
      | 7         | 10       | accepted |
      | 7         | 6        | rejected |
      | 7         | 3        | rejected |
      | K         | K        | accepted |
      | K         | A        | accepted |
      | K         | 2        | accepted |
      | K         | Q        | rejected |
      | A         | A        | accepted |
      | A         | 2        | accepted |
      | A         | K        | rejected |

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

  @progression @face-cards
  Scenario: Special ranks (10, A, 2) always allowed for progression
    Given the last claim was rank "5"
    When player 2 plays cards claiming rank "10"
    Then the move should be accepted

  @progression @rank-order
  Scenario: Rank order is correct
    Then the rank order should be "3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2"

