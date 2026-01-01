Feature: Burn (Table Clear)
  As a game engine
  I need to clear the table on certain conditions
  So that players can use strategic burns

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @burn @ten
  Scenario: Ten burns the table when accepted
    Given the table pile has 10 cards
    When player 1 plays cards claiming rank "10"
    And no player challenges
    Then the table pile should be empty
    And the burn pile should have increased by 11 cards
    And an event "PILE_BURNED" should be emitted with reason "TEN"
    And player 1 should continue with another turn

  @burn @ten
  Scenario: Ten burns after successful challenge defense
    Given the table pile has 10 cards
    When player 1 plays 2 cards "10♥, 10♦" claiming rank "10"
    And player 2 challenges
    And the claim was true
    Then player 2 should pick up 0 cards from table
    Then the table pile should be burned
    And player 1 should continue with another turn

  @burn @ten
  Scenario: Ten does not burn if challenged and was a lie
    Given the table pile has 10 cards
    When player 1 plays 2 cards "3♥, 4♦" claiming rank "10"
    And player 2 challenges
    And the claim was a lie
    Then the table pile should not be burned
    And player 1 should pick up 12 cards

  @burn @ace
  Scenario: Ace burns the table when accepted
    Given the table pile has 8 cards
    When player 1 plays cards claiming rank "A"
    And no player challenges
    Then the table pile should be empty
    And the burn pile should have increased
    And an event "PILE_BURNED" should be emitted with reason "ACE"

  @burn @ace
  Scenario: Ace burns after successful challenge defense
    Given the table pile has 8 cards
    When player 1 plays 1 card "A♥" claiming rank "A"
    And player 2 challenges
    And the claim was true
    Then the table pile should be burned
    And player 2 picks up 0 cards since pile was burned
    And player 1 should continue

  @burn @four-in-row
  Scenario: Four consecutive same rank burns
    Given the claim history is:
      | rank | count |
      | 7    | 1     |
      | 7    | 2     |
      | 7    | 1     |
    When player 4 plays cards claiming rank "7"
    And no player challenges
    Then the table pile should be burned
    And an event "PILE_BURNED" should be emitted with reason "FOUR_IN_ROW"

  @burn @four-in-row
  Scenario: Four in row resets after different rank
    Given the claim history is:
      | rank | count |
      | 7    | 1     |
      | 7    | 2     |
      | 8    | 1     |
      | 7    | 1     |
    When player 1 plays cards claiming rank "7"
    And no player challenges
    Then the table pile should not be burned

  @burn @four-in-row
  Scenario: Four in row counts only accepted claims
    Given the claim history is:
      | rank | count | accepted |
      | 7    | 1     | true     |
      | 7    | 2     | true     |
      | 7    | 1     | false    |
    And the false claim was challenged and was a lie
    When player 4 plays cards claiming rank "7"
    And no player challenges
    Then the table pile should not be burned
    And the four-in-row counter should be at 3

  @burn @continuation
  Scenario: Player continues after burning
    Given player 1 causes a burn with rank "10"
    Then the table pile should be empty
    And the last claim should be reset
    And player 1 should be the current player
    And player 1 can claim any rank

  @burn @reset
  Scenario: Claim progression resets after burn
    Given the last claim was rank "K"
    When player 1 plays cards claiming rank "10"
    And the table burns
    Then player 1 can claim any rank including "3"
    And there should be no last claim restriction



