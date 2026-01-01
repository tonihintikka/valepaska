Feature: Play Action
  As a player
  I need to play cards face-down and make claims
  So that I can try to empty my hand

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @play
  Scenario: Playing a single card with truthful claim
    Given player 1 has cards "7♥, 7♦, 5♣, 9♠, K♥"
    And it is player 1's turn
    When player 1 plays 1 card "7♥" claiming rank "7"
    Then the table pile should have 1 card
    And the last claim should be rank "7" count 1
    And the challenge window should be open

  @play
  Scenario: Playing multiple cards with truthful claim
    Given player 1 has cards "7♥, 7♦, 7♣, 9♠, K♥"
    And it is player 1's turn
    When player 1 plays 3 cards "7♥, 7♦, 7♣" claiming rank "7"
    Then the table pile should have 3 cards
    And the last claim should be rank "7" count 3

  @play @bluff
  Scenario: Playing cards with a bluff claim
    Given player 1 has cards "3♥, 4♦, 5♣, 6♠, 8♥"
    And it is player 1's turn
    And the last claim was rank "7"
    When player 1 plays 2 cards "3♥, 4♦" claiming rank "8"
    Then the table pile should increase by 2
    And the last claim should be rank "8" count 2
    And the actual played cards should be "3♥, 4♦"

  @play @validation
  Scenario: Cannot play zero cards
    Given it is player 1's turn
    When player 1 tries to play 0 cards
    Then the move should be rejected with error "Must play at least 1 card"

  @play @validation
  Scenario: Cannot play more than 4 cards
    Given player 1 has cards "7♥, 7♦, 7♣, 7♠, 9♥, 9♦"
    And it is player 1's turn
    When player 1 tries to play 5 cards
    Then the move should be rejected with error "Cannot play more than 4 cards"

  @play @validation
  Scenario: Cannot play cards not in hand
    Given player 1 has cards "3♥, 4♦, 5♣, 6♠, 8♥"
    And it is player 1's turn
    When player 1 tries to play card "A♠"
    Then the move should be rejected with error "Card not in player's hand"

  @play @validation
  Scenario: Cannot play when not your turn
    Given it is player 1's turn
    When player 2 tries to play a card
    Then the move should be rejected with error "Not player's turn"

  @play @maxcards
  Scenario Outline: Playing different valid card counts
    Given player 1 has cards "7♥, 7♦, 7♣, 7♠, 9♥"
    And it is player 1's turn
    When player 1 plays <count> cards claiming rank "7"
    Then the move should be accepted
    And the table pile should have <count> cards

    Examples:
      | count |
      | 1     |
      | 2     |
      | 3     |
      | 4     |



