Feature: Hand Replenishment
  As a player
  I need my hand replenished to 5 cards after playing
  So that I always have options while the draw pile has cards

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @replenishment
  Scenario: Hand replenishes to 5 after playing cards
    Given player 1 has 5 cards in hand
    And the draw pile has 20 cards
    When player 1 plays 2 cards
    And the turn is completed without challenge
    Then player 1 should have 5 cards in hand
    And the draw pile should have 18 cards

  @replenishment
  Scenario: Hand replenishes after playing all matching cards
    Given player 1 has 5 cards in hand
    And the draw pile has 20 cards
    When player 1 plays 4 cards
    And the turn is completed without challenge
    Then player 1 should have 5 cards in hand
    And the draw pile should have 16 cards

  @replenishment
  Scenario: Partial replenishment when draw pile has fewer cards
    Given player 1 has 5 cards in hand
    And the draw pile has 2 cards
    When player 1 plays 4 cards
    And the turn is completed without challenge
    Then player 1 should have 3 cards in hand
    And the draw pile should have 0 cards

  @endgame
  Scenario: No replenishment when draw pile is empty
    Given player 1 has 5 cards in hand
    And the draw pile has 0 cards
    When player 1 plays 2 cards
    And the turn is completed without challenge
    Then player 1 should have 3 cards in hand
    And the draw pile should have 0 cards

  @endgame
  Scenario: Player can play down to zero cards in endgame
    Given player 1 has 3 cards in hand
    And the draw pile has 0 cards
    When player 1 plays 3 cards with a valid claim
    And no other player challenges
    Then player 1 should have 0 cards in hand
    And player 1 should be declared the winner

  @replenishment @challenger
  Scenario: Challenger's hand increases when challenge fails
    Given player 1 has 5 cards in hand
    And player 2 has 5 cards in hand
    And the draw pile has 20 cards
    And the table pile has 8 cards
    When player 1 plays 2 cards claiming "7"
    And player 2 challenges
    And the claim was true
    Then player 2 should have more than 5 cards in hand
    And player 2 should have picked up 10 cards from the table

  @replenishment @liar
  Scenario: Liar's hand increases when caught
    Given player 1 has 5 cards in hand
    And the draw pile has 20 cards
    And the table pile has 8 cards
    When player 1 plays 2 cards claiming "7" but actually plays "3"
    And player 2 challenges
    And the claim was a lie
    Then player 1 should have more than 5 cards in hand
    And player 1 should have picked up 10 cards from the table




