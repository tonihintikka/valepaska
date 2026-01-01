Feature: Winning
  As a player
  I need clear win conditions
  So that the game has a proper ending

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @winning
  Scenario: Cannot win while draw pile has cards
    Given the draw pile has 10 cards
    And player 1 has 5 cards in hand
    When player 1 plays 5 cards
    And no player challenges
    Then player 1 should have 5 cards in hand after replenishment
    And the game should continue

  @winning @endgame
  Scenario: Win by emptying hand in endgame
    Given the draw pile is empty
    And player 1 has 3 cards in hand
    When player 1 plays 3 cards with a valid claim
    And no player challenges
    Then player 1 should have 0 cards in hand
    And player 1 should be declared the winner
    And an event "PLAYER_WON" should be emitted with playerId of player 1

  @winning @endgame @challenge
  Scenario: Win denied by successful challenge
    Given the draw pile is empty
    And player 1 has 2 cards in hand
    And the table pile has 5 cards
    When player 1 plays 2 cards "3♥, 4♦" claiming rank "K"
    And player 2 challenges
    And the claim was a lie
    Then player 1 should have 9 cards in hand
    And player 1 should not be the winner
    And the game should continue with player 2's turn

  @winning @endgame @challenge
  Scenario: Win confirmed after failed challenge
    Given the draw pile is empty
    And player 1 has 2 cards in hand
    When player 1 plays 2 cards "K♥, K♦" claiming rank "K"
    And player 2 challenges
    And the claim was true
    Then player 2 should pick up the table pile
    And player 1 should have 0 cards in hand
    And player 1 should be declared the winner

  @winning @burn
  Scenario: Win by burning with last cards
    Given the draw pile is empty
    And player 1 has 2 cards in hand
    When player 1 plays 2 cards "10♥, 10♦" claiming rank "10"
    And no player challenges
    Then the table should burn
    And player 1 should have 0 cards in hand
    And player 1 should be declared the winner

  @winning @game-over
  Scenario: Game ends when winner is declared
    Given player 1 has been declared the winner
    Then the game phase should be "GAME_OVER"
    And no more moves should be accepted
    And the final standings should be recorded

  @winning @multiple
  Scenario: Only first player to empty hand wins
    Given the draw pile is empty
    And player 1 has 2 cards in hand
    And player 2 has 3 cards in hand
    When player 1 plays 2 cards with a valid claim
    And no player challenges
    Then player 1 should be the winner
    And player 2 should not be the winner
    And other players' remaining cards should be recorded



