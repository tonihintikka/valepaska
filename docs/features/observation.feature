Feature: Player Observation
  As a game engine
  I need to provide limited information to players and bots
  So that hidden information remains hidden

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @observation
  Scenario: Player can see their own hand
    Given player 1 has cards "7♥, 7♦, 5♣, 9♠, K♥"
    When player 1 requests their observation
    Then the observation should contain their hand with 5 cards
    And the hand should show "7♥, 7♦, 5♣, 9♠, K♥"

  @observation @hidden
  Scenario: Player cannot see other players' hands
    Given player 1 has 5 cards
    And player 2 has 5 cards
    When player 1 requests their observation
    Then the observation should show player 2's hand size as 5
    But the observation should not reveal player 2's actual cards

  @observation @hidden
  Scenario: Player cannot see draw pile contents
    Given the draw pile has 32 cards
    When player 1 requests their observation
    Then the observation should show draw pile size as 32
    But the observation should not reveal draw pile cards

  @observation @hidden
  Scenario: Player cannot see table pile contents
    Given the table pile has 8 cards
    When player 1 requests their observation
    Then the observation should show table pile size as 8
    But the observation should not reveal table pile cards

  @observation
  Scenario: Player can see claim history
    Given the claim history contains:
      | player | rank | count |
      | 1      | 5    | 2     |
      | 2      | 7    | 1     |
      | 3      | 10   | 3     |
    When player 4 requests their observation
    Then the observation should contain the full claim history
    And the last claim should be rank "10" count 3 by player 3

  @observation
  Scenario: Player can see valid claim ranks
    Given the last claim was rank "7"
    When player 2 requests their observation
    Then the observation should list valid claim ranks
    And valid ranks should include "7", "8", "9", "10", "J", "Q", "K", "A", "2"
    And valid ranks should not include "3", "4", "5", "6"

  @observation @special-rule
  Scenario: Valid ranks after 2
    Given the last claim was rank "2"
    When player 2 requests their observation
    Then the valid claim ranks should be only "2", "10", "A"

  @observation @endgame
  Scenario: Observation indicates endgame
    Given the draw pile is empty
    When player 1 requests their observation
    Then the observation should indicate isEndgame as true

  @observation @bot
  Scenario: Bot receives only observation, not full state
    Given a bot is registered for player 2
    When it is player 2's turn
    Then the bot should receive a PlayerObservation
    And the bot should not receive the full GameState
    And the bot should not see hidden cards

  @observation
  Scenario: Observation includes other players' hand sizes
    Given player 1 has 5 cards
    And player 2 has 8 cards
    And player 3 has 3 cards
    And player 4 has 12 cards
    When player 1 requests their observation
    Then the observation should show:
      | player | hand_size |
      | 2      | 8         |
      | 3      | 3         |
      | 4      | 12        |



