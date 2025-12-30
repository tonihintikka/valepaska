Feature: Claim Progression
  As a player
  I need to make claims that follow the rank progression rules
  So that the game maintains proper flow

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @progression
  Scenario: First claim can be any rank
    Given the table pile is empty
    And there is no last claim
    When player 1 plays cards claiming rank "7"
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
      | 3         | K        | accepted |
      | 3         | A        | accepted |
      | 3         | 2        | accepted |
      | 7         | 7        | accepted |
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
  Scenario: After 2, only 2, 10, or A are valid
    Given the last claim was rank "2"
    When player 2 plays cards claiming rank "2"
    Then the move should be accepted

  @progression @special-rule
  Scenario: After 2, claiming 10 is valid
    Given the last claim was rank "2"
    When player 2 plays cards claiming rank "10"
    Then the move should be accepted

  @progression @special-rule
  Scenario: After 2, claiming A is valid
    Given the last claim was rank "2"
    When player 2 plays cards claiming rank "A"
    Then the move should be accepted

  @progression @special-rule @validation
  Scenario Outline: After 2, other ranks are invalid
    Given the last claim was rank "2"
    When player 2 tries to play cards claiming rank "<rank>"
    Then the move should be rejected with error "After 2, only 2, 10, or A are valid claims"

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

  @progression @rank-order
  Scenario: Rank order is correct
    Then the rank order should be "3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2"

